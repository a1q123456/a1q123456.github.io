---
title:  "NURBS ray tracing"
subtitle: "Curves"
date:   2024-03-17 00:00:00
---

The general form of NURBS is defined as:
$$
C(u) = \frac {\sum_{i}^{n}N_{i,k}(u)w_iP_i} {\sum_{i}^{n}N_{i,k}(u)w_i}
$$
, where N is the B-Spline basis function, n is the number of control points, $w_i$ are the weights, $P_i$ are control points, and k is the degree. 

The B-Spline basis function of degree 0 is defined as:

$$
N_{i,0}(u) = 
\begin{cases} 
1 & \text{if}~ u_i \leq u < u_{i+1} \\
0 & \text{otherwise}
\end{cases}
$$

For higher degrees, the B-Spline basis functions are defined recursively:
$$
N_{i,n}(u) = \frac{u - u_i}{u_{i+k} - u_i} N_{i,k-1}(u) + \frac{u_{i+k+1} - u}{u_{i+k+1} - u_{i+1}} N_{i+1,k-1}(u)
$$
,
where  are knots,  is the degree.

Surely, calculating this function when rendering every frame is horribly slow, but luckily, we're able to simplify this if we know what degree we want. 

We should define the above function in matlab in order to simplify it later:
```c
function y = b_basis(U, u, i, k)
    if k == 0
        y = piecewise((U(i) <= u) & (u <= U(i+1)), 1, 0);
    else
        if U(i+k) == U(i) && U(i+k+1) == U(i+1)
            y = 0;
        elseif U(i+k) == U(i)
            y = ((U(i+k+1) - u) / (U(i+k+1) - U(i+1))) * b_basis(U, u, i+1, k-1);
        elseif U(i+k+1) == U(i+1)
            y = ((u - U(i)) / (U(i+k) - U(i))) * b_basis(U, u, i, k-1);
        else
            y = ((u - U(i)) / (U(i+k) - U(i))) * b_basis(U, u, i, k-1) + ((U(i+k+1) - u) / (U(i+k+1) - U(i+1))) * b_basis(U, u, i+1, k-1);
        end
    end
end
```
Let's give it some assumptions so that we can simplify the function. In this case, we can assume that $u_{i+1}$ is equal to $ u_i+1$
```c
syms u U(i) i U_0 P
assume(U_0+3 < u & u < U_0+4);

N_0 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7 U_0+8], u, 1, 3);
N_1 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7 U_0+8], u, 2, 3);
N_2 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7 U_0+8], u, 3, 3);
N_3 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7 U_0+8], u, 4, 3);
```

As $u$ is between $U_0+3$ and $U_0+4$, we can plug $P=u-U_0+3$ into those equations so that we'll be able to call the function with only the fractional part.
```c
N_0 = expand(subs(N_0, U_0, u-P-3))
```
$$
-\frac{P^3 }{6}+\frac{P^2 }{2}-\frac{P}{2}+\frac{1}{6}
$$
```c
N_1 = expand(subs(N_1, U_0, u-P-3))
```
$$\frac{P^3 }{2}-P^2 +\frac{2}{3}$$
```c
N_2 = expand(subs(N_2, U_0, u-P-3))
```
$$-\frac{P^3 }{2}+\frac{P^2 }{2}+\frac{P}{2}+\frac{1}{6}$$
```c
N_3 = expand(subs(N_3, U_0, u-P-3))
```
$$\frac{P^3 }{6}$$
You may have noticed that we're assuming that we've assumed that the knot vectors are uniform. i.e. an equivalent knot vector would be something like $(0, 1, 2, 3, 4, 5, 6)$. This is not 100% useful as we sometimes need to insert some end knots so that the starting and the ending parts can stick to the first and the last control point. To address this, we should create some more functions.

The functions for the first span can be simplified to:
```c
assume(U_0 < u & u < U_0+1)
N_0_start_0 =  b_basis([U_0 U_0 U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7], u, 1, 3);
N_0_start_0 = expand(subs(N_0_start_0, U_0, u-P))
```
$$
\frac{7\,P^3 }{4}-\frac{9\,P^2 }{2}+3\,P
$$
```c
N_1_start_0 =  b_basis([U_0 U_0 U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7], u, 2, 3);
N_1_start_0 = expand(subs(N_1_start_0, U_0, u-P))
```
$$\frac{3\,P^2 }{2}-\frac{11\,P^3 }{12}$$
As the first span is only affected by the first three control points, we only need three functions. The last function is actually the same as the forth NURBS function $N_3$ so it doesn't make sense to make it again.

The functions for the second span can be simplified to:
```c
assume(U_0+1 < u & u < U_0+2)
N_0_start_1 =  b_basis([U_0 U_0 U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7], u, 1, 3);
N_0_start_1 = expand(subs(N_0_start_1, U_0, u-P-1))
```
$$-\frac{P^3 }{4}+\frac{3\,P^2 }{4}-\frac{3\,P}{4}+\frac{1}{4}$$
```c
N_1_start_1 =  b_basis([U_0 U_0 U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+6 U_0+7], u, 2, 3);
N_1_start_1 = expand(subs(N_1_start_1, U_0, u-P-1))
```
$$\frac{7\,P^3 }{12}-\frac{5\,P^2 }{4}+\frac{P}{4}+\frac{7}{12}$$
We need four functions for the second span as it's affected by the first forth control points. The first two functions are defined as the above, and the last two functions are just the same as the $N_2$ and $N_3$.


The functions for the last second span can be simplified to:
```c
assume(U_0+3 < u & u < U_0+4)
N_0_end_1 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+5 U_0+5], u, 3, 3);
N_0_end_1 = expand(subs(N_0_end_1, U_0, u-P-3))
```
$$-\frac{7\,P^3 }{12}+\frac{P^2 }{2}+\frac{P}{2}+\frac{1}{6}$$
```c
N_1_end_1 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+5 U_0+5], u, 4, 3);
N_1_end_1 = expand(subs(N_1_end_1, U_0, u-P-3))
```
$$\frac{P^3 }{4}$$

And finally, the functions for the last span can be simplified to:
```c
assume(U_0+4 < u & u < U_0+5)
N_0_end_0 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+5 U_0+5], u, 3, 3);
N_0_end_0 = expand(subs(N_0_end_0, U_0, u-P-4))
```
$$\frac{11\,P^3 }{12}-\frac{5\,P^2 }{4}-\frac{P}{4}+\frac{7}{12}$$
```c
N_1_end_0 =  b_basis([U_0 U_0+1 U_0+2 U_0+3 U_0+4 U_0+5 U_0+5 U_0+5], u, 4, 3);
N_1_end_0 = expand(subs(N_1_end_0, U_0, u-P-4))
```
$$-\frac{7\,P^3 }{4}+\frac{3\,P^2 }{4}+\frac{3\,P}{4}+\frac{1}{4}$$

Given the functions, we should be able to try rendering a curve and test against the recursive function to see if our simplifications are correct.

Let's the recursive NURBS first:
```c
function y = nurbs(U, W, C, u, k)
    y = 0;
    b = 0;
    r = 0;
    for i = 1:length(C)
        b = b + b_basis_val(U, u, i, k) * W(i);
    end
    
    for i = 1:length(C)
        r = r + b_basis_val(U, u, i, k) * W(i) * C(i);
    end

    y = r / b;
end

function y = b_basis_val(U, u, i, k)
    if k == 0
        if U(i) <= u && u <= U(i+1)
            y = 1;
        else
            y = 0;
        end
    else
        if U(i+k) == U(i)
            y = ((U(i+k+1) - u) / (U(i+k+1) - U(i+1))) * b_basis_val(U, u, i+1, k-1);
        elseif (U(i+k+1) == U(i+1))
             y = ((u - U(i)) / (U(i+k) - U(i))) * b_basis_val(U, u, i, k-1);
        else
            y = ((u - U(i)) / (U(i+k) - U(i))) * b_basis_val(U, u, i, k-1) + ((U(i+k+1) - u) / (U(i+k+1) - U(i+1))) * b_basis_val(U, u, i+1, k-1);
        end
    end
end
```

And then, let's define the curve:
```c
spline_control_points = [1 5 3 -1 14 22 9 3];
spline_weights = [1 1 1 1 1 1 1 1];
spline_knots = [1 1 1 2 3 4 5 6 7 8 8 8];
```

Draw the curve using the recursive function. We'll check our simplified functions against this.
```c
my_nurbs = @(t) nurbs(spline_knots, spline_weights, spline_control_points, t, 3);


figure;
hold on;

fplot(@(x) arrayfun(my_nurbs, x), [1 8])

plot(spline_control_points, '-r'); 


hold off;
```
![Kernel](/images/4-nurbs-curves.md/nurbs_resursive.jpg)

And then, let's draw the curve with our simplified functions. Actually, with the simplified functions, it's so natural to use convolution to calculate the curve, enabling the potential optimisations by fast fourier transform:
```c
F_0 = matlabFunction(N_0);
F_1 = matlabFunction(N_1);
F_2 = matlabFunction(N_2);
F_3 = matlabFunction(N_3);
F_0_start_0 = matlabFunction(N_0_start_0);
F_0_start_1 = matlabFunction(N_0_start_1);
F_1_start_0 = matlabFunction(N_1_start_0);
F_1_start_1 = matlabFunction(N_1_start_1);
F_0_end_0 = matlabFunction(N_0_end_0);
F_0_end_1 = matlabFunction(N_0_end_1);
F_1_end_0 = matlabFunction(N_1_end_0);
F_1_end_1 = matlabFunction(N_1_end_1);


t = 0:0.1:0.9;

b_values_start_0 = [F_3(t); F_1_start_0(t); F_0_start_0(t)]';
b_values_start_1 = [F_3(t); F_2(t); F_1_start_1(t); F_0_start_1(t)]';
start_0 = conv2(1, spline_control_points(1:3), b_values_start_0, 'valid') ./ sum(b_values_start_0, 2);
start_1 = conv2(1, spline_control_points(1:4), b_values_start_1, 'valid') ./ sum(b_values_start_1, 2);

b_values = [F_3(t); F_2(t); F_1(t); F_0(t)]';

simplified_nurbs_matrix = conv2(1, spline_control_points, b_values, 'same');
simplified_nurbs = simplified_nurbs_matrix(:)';
% Get rid of the last 10 elements generated by the 2d convolution
simplified_nurbs(end-10+1:end) = [];

b_values_end_1 = [F_1_end_1(t); F_0_end_1(t); F_1(t); F_0(t)]';
b_values_end_0 = [F_1_end_0(t); F_0_end_0(t); F_0(t)]';

end_1 = conv2(1, spline_control_points(end-4+1:end), b_values_end_1, 'valid') ./ sum(b_values_end_1, 2);
end_0 = conv2(1, spline_control_points(end-3+1:end), b_values_end_0, 'valid') ./ sum(b_values_end_0, 2);

figure;
hold on;
plot(1:0.1:7.9, [start_0' start_1' simplified_nurbs end_1' end_0']);
plot(spline_control_points, '-r'); 

hold off;
```
![Kernel](/images/4-nurbs-curves.md/nurbs_simplified.jpg)
 