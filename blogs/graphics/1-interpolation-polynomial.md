---
title:  "Texture Interpolation"
subtitle: "Part 1 Polynomial Interpolation"
date:   2023-02-16 00:00:00
---

Interpolation is commonly used in computer programs. The most common interpolation method is linear interpolation, which takes two values and generates continuous uniform distributed results. For example, say we have a data set `[10, 30, 40, 0]`. The linear interpolation result of the data set will be like the following:

![Linear Interpolation](/images/1-interpolation-polynomial.md/linear.jpg)

As the figure shows, linear interpolation does generate a continuous result. However, the curve that it generates could be smoother. Sometimes, we may not want those sharp corners. For example, if we're going to describe a spherical object, those sharp corners may make it look bad; Or if we are trying to interpolate an image, we may find the interpolated image weird.

To address this issue, we should use interpolation methods which generate smooth results.

# Polynomial Interpolation

The data set `[10, 30, 40, 0]` contains four values, which means to describe a curve passing all four points, we need a three-degree polynomial, $ax^3+bx^2+cx+d=y$. Where $a$, $b$, $c$ and $d$ are coefficients, we will need to find them out. It is easy because with known $x$ and $y$ values, we can create a linear system based on them and use matrices to solve the issue.

The linear system based on the data set is:
$$
\begin{cases}
y_{1} = a \cdot x_{1}^3 + b \cdot x_{1}^2 + c \cdot x_{1} + d \\ 
y_{2} = a \cdot x_{2}^3 + b \cdot x_{2}^2 + c \cdot x_{2} + d \\ 
y_{3} = a \cdot x_{3}^3 + b \cdot x_{3}^2 + c \cdot x_{3} + d \\ 
y_{4} = a \cdot x_{4}^3 + b \cdot x_{4}^2 + c \cdot x_{4} + d \\ 
\end{cases}
$$

And the matrix form of the above is:
$$
\begin{bmatrix}
x_{1}^3 & x_{1}^2 & x_{1} & 1 \\
x_{2}^3 & x_{2}^2 & x_{2} & 1 \\
x_{3}^3 & x_{3}^2 & x_{3} & 1 \\
x_{4}^3 & x_{4}^2 & x_{4} & 1
\end{bmatrix}
\begin{bmatrix}
a \\
b \\
c \\
d \\
\end{bmatrix} = 
\begin{bmatrix}
y_{1} \\
y_{2} \\
y_{3} \\
y_{4}
\end{bmatrix}
$$

To calculate $\begin{bmatrix} a \\ b \\ c \\ d \end{bmatrix}$, we transform the above equation to:

$$
\begin{bmatrix}
a \\
b \\
c \\
d \\
\end{bmatrix}
=
\begin{bmatrix}
x_{1}^3 & x_{1}^2 & x_{1} & 1 \\
x_{2}^3 & x_{2}^2 & x_{2} & 1 \\
x_{3}^3 & x_{3}^2 & x_{3} & 1 \\
x_{4}^3 & x_{4}^2 & x_{4} & 1
\end{bmatrix}^{-1}
\begin{bmatrix}
y_{1} \\
y_{2} \\
y_{3} \\
y_{4}
\end{bmatrix}
$$

Then, we substitute $x$ and $y$ with the values to resolve the above formula:

$$
\begin{bmatrix}
a \\
b \\
c \\
d
\end{bmatrix}
=
\begin{bmatrix}
-6.66666666666667 \\ 
15.0000000000000 \\ 
11.6666666666667 \\ 
10 
\end{bmatrix}
$$

Then, the form of the polynomial is $-6.67x^3+15x^2+11.67x+10=y$.
If we draw the above polynomial, the result will be:

![Polynomial](/images/1-interpolation-polynomial.md/polynomial.jpg)

The blue curve is the polynomial curve. It passes through all the data points and generates a smooth result. 

We can simplify the above steps to a small Matlab program:
```c
function coeffs = find_coeff(xvals, yvals)
    A = transpose(xvals).^(length(xvals)-1:-1:0);

    coeffs = transpose(A \ transpose(yvals));
end

function y = polynomial(coeffs, t)
    powers = transpose(length(coeffs) - 1:-1:0);
    y = sum(transpose(transpose(t.^powers).*coeffs));
end

```
Where `coeffs` is the coefficients for the n-degree polynomial. If we have more values to interpolate, the `find_coeff` function generates a higher-degree polynomial. For example, to interpolate the data set `[10, 30, 40, 0, 10, 15, 0]`, the result coefficients will be `[0.6806, -12.6667, 88.2639, -280.8333, 388.5556, -164.0000, 10.0000]`, it results a curve like the following:

![Higher-Degree Polynomial](/images/1-interpolation-polynomial.md/higher-degree.jpg)

If we have more data points, we need to create a higher-degree polynomial. However, calculating the coefficients may take a long time if there are a lot of data. To make this process faster and gain more control over the curve, we can use multiple polynomials to describe each piece of the shape, called *spines*. We will discuss splines in the following article.
