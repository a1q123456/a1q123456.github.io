---
title:  "Interpolation in Graphics World"
subtitle: "Part 3 Cubic Convolution"
date:   2023-02-27 00:00:00
---


Cubic convolution provides a fast way to interpolate the texture data, which Keys originally proposed. With this method, texture sampling can be simplified to taking four samples, multiplying them with four weights, and adding all of them together. It takes discrete image data and an interpolation kernel and outputs continuous data. The convolution kernel is the following:

$$
u(s):=
\begin{cases}
(a + 2)|s|^3 - (a + 3)|s|^2 + 1 & \text{if } 0 \leq |s| \leq 1 \\
a|s|^3 - 5a|s|^2 + 8a|s| - 4a & \text{if } 1 \leq |s| \leq 2 \\
0 & \text{otherwise}
\end{cases}
$$

Where $a$ is a constant, we usually choose $-0.5$ as the value. To apply the above kernel, we use the following function:

$$
g(x) = \sum_{i} c_{i}u(\frac {x - x_{i}} {h})
$$

Where $i$ is the index of the input image data, $c_{i}$ is the colour value, and $x$ is the interpolation point. Because $u(s)$ is $0$ if $s$ is not in the range of $[-2, 2]$, $x_i$ can only be the four nearest indexes to $x$. 

For example, if $x$ is 5.5, then $x_i$ can only be $4$, $5$, $6$ and $7$, and the parameter $s$ of the kernel function $u(s)$ can only be $1.5$, $0.5$, $-0.5$ and $-1.5$. We then take the four pixels and multiply them by $u(s)$, resulting in:

$$
g(5.5) = u(1.5)c_{4} + u(0.5)c_{5} + u(-0.5)c_{6} + u(-1.5)c_{7}
$$

Where $c$ is the image data, and $g(5.5)$ is the output colour.

When we scale up an image, where we need to interpolate is naturally pre-defined. In this case, we only need to pre-calculate four results of the $u(s)$ function, multiply the nearest four pixels by the results we calculated before, and then add them together. A C++ implementation can be found [here](https://github.com/a1q123456/SWRenderer/blob/master/image-processing/rescaling.cc#L7).

# Analysing the kernel function

I translated the kernel function into the following Matlab code:
```c
function y = kernel(x, a)

    y = x;
    y(:) = 0;

    x0 = x(0 < abs(x) & abs(x) < 1);
    x1 = x(1 < abs(x) & abs(x) < 2);
    y(0 < abs(x) & abs(x) < 1) = (a + 2) * abs(x0).^3 - (a + 3) * abs(x0).^2 + 1;
    y(1 < abs(x) & abs(x) < 2) = a * abs(x1).^3 - 5 * a * abs(x1).^2 + 8 * a * abs(x1) - 4 * a;
    y(x == 0) = 1;

end
```

The above function outputs the following figure:

![Kernel](/images/3-interpolation-cubic-convolution.md/kernel.jpg)

According to the figure, the function outputs a negative value when $|s|$ is in the range of $[1, 2]$, and it outputs $1$ if $s$ is $0$, meaning the convolution function outputs $x_i$ when $x = x_i$.
