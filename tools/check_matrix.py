import numpy as np

# Quaternion q = (-0.5, -0.5, -0.5, 0.5)
# Let's compute rotation matrix
x, y, z, w = -0.5, -0.5, -0.5, 0.5
R = np.array([
    [1 - 2*(y*y + z*z),     2*(x*y - z*w),     2*(x*z + y*w)],
    [    2*(x*y + z*w), 1 - 2*(x*x + z*z),     2*(y*z - x*w)],
    [    2*(x*z - y*w),     2*(y*z + x*w), 1 - 2*(x*x + y*y)]
])
print("Rotation matrix:\n", R)

# Vertices min = [-18.68, -26.24, 0.89], max = [22.65, 30.43, 37.56]
# Let's rotate the 8 corners:
corners = [
    [x, y, z]
    for x in [-18.68, 22.65]
    for y in [-26.24, 30.43]
    for z in [0.89, 37.56]
]
rot_corners = [R @ c for c in corners]
rot_min = np.min(rot_corners, axis=0)
rot_max = np.max(rot_corners, axis=0)
print("Rotated min (X, Y, Z):", rot_min)
print("Rotated max (X, Y, Z):", rot_max)
