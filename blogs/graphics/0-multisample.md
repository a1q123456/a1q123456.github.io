---
title:  "Multisample Anti-aliasing"
date:   2023-02-15 00:00:00
---

# The Image Distoration Issue and Anti-aliasing Algorithms

In 3D rendering, aliasing or image distortion is a difficult part that requires a lot of calculations to solve. It distorts images and makes images a bit ugly. For example, the following image was rendered by my [SWRenderer](https://github.com/a1q123456/SWRenderer) project without any anti-aliasing:

![Aliasing Issue](/images/0-multisample.md/aliasing.png)

The edges of the box are jagged.

![Aliasing Issue](/images/0-multisample.md/aliasing-2.png)

Luckily, there are a few ways to tackle this issue. The simplest way is supersampling. It is to divide each pixel into multiple subpixels, render each subpixel and output the average value of the subpixels for each pixel. However, despite this method being able to solve the issue perfectly, it needs too much calculation and is almost impossible to use in realtime rendering. Instead, multisample is more commonly used. 

The multisample algorithm only renders each pixel once, but it still gives an excellent result.

# The Algorithm

![Pixel Coverage](/images/0-multisample.md/pixel-coverage.png)

Say we are rendering a triangle like the above. The blue points are the subsamples, and the red triangle is the triangle we are rendering. 

Without multisampling, the output image may look like the following, as only pixel 5 is fully covered by the triangle.

![Pixel Coverage](/images/0-multisample.md/aliased.png)

To make the image better, we divide pixels which are not fully covered by a triangle into a couple of subpixels. Instead of rendering them, we only use them to calculate the *coverage* of the pixel. If a pixel is fully covered, we deem the coverage of the pixel to be 100%.

With barycentric coordination, we can tell whether or not a point is in a triangle. We then can tell how many subsamples of a pixel are in the triangle. The ratio of how many subsamples are in the triangle to the total number of subsamples is the *coverage*. If the coverage of a pixel is not 0, we render the pixel and multiply the colour by the coverage.

Without multisampling, only pixel 5 will be rendered, but with multisampling, pixels 1, 4, 5, 6 and 7 will be rendered, and with pixels that are not fully covered by the triangle, the image will look better.

The output may look like this:

![Pixel Coverage](/images/0-multisample.md/anti-aliased.png)

# The Implementation

To implement this in a renderer, we should also consider the depth of each subsample. We may generate a wrong result otherwise.

Say we are rendering a model which has three triangles. 

![The Depth Issue](/images/0-multisample.md/depth.png)

The red line is the pixel we are rendering, and the black lines are triangles. All the triangles will be projected to the camera at the bottom of the figure. In this case, the colour of the pixel should be from triangles 2 and 3, and triangle one should not be rendered as it is covered by the two and 3. 

If we pick up triangle three first when we render the red pixel, we may get colour from the triangle with 50% of the coverage; Then, if we pick up triangle 1, we may get colour from the triangle with 100% of the coverage. As a result, the colour from the triangle replaces the from triangle 3. It is wrong because triangle 3 is closer to the camera.

To tackle this issue, I created an array of colour and depth data for each pixel in the [SWRenderer](https://github.com/a1q123456/SWRenderer) project. Each subsample corresponds to an element in the array. When the renderer renders a pixel with subsamples, it stores the colour into the corresponding element in the subsample colour array if the depth is lower than the corresponding current depth.

The implementation is like the following:
```c++
for (auto sampleIndex : samplesInTriangle)
{
    auto& [colorUnderLayer, depthUnderLayer] = colors[sampleIndex];

    if (depth < depthUnderLayer)
    {
        colors[sampleIndex] = std::make_tuple(sampleColor, depth);
    }
}
```
`colors` is the array we mentioned before; `samplesInTriangle` is an array of the indexes of subsamples in the triangle; `sampleColor` is the output colour from the pixel shader; `depth` is the depth of the current pixel.

We then mix the colours with code like this:
```c++
for (int i = 0; i < colors.size(); i++)
{
    auto& color = colors[i];
    auto& [sampleColor, depth] = color;

    finalColor += (sampleColor * glm::vec4{sampleWeight, sampleWeight, sampleWeight, sampleCoverage});
    finalDepth += (depth * sampleWeight);
}
```

# Result

Without anti-aliasing, the framerate is 14 fps, and with multisampling and eight subsamples per pixel, the framerate only dropped to 11 fps. And the edges of the box look a lot better.

![No anti-aliasing](/images/0-multisample.md/result-1.png)
![With anti-aliasing](/images/0-multisample.md/result-2.png)

