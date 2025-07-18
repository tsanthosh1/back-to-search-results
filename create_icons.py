#!/usr/bin/env python3
"""
Create placeholder PNG icons for Chrome extension
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a blue circle background
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(66, 133, 244, 255))
    
    # Draw a white arrow pointing left
    arrow_size = size // 3
    center_x, center_y = size // 2, size // 2
    
    # Left arrow points (triangle pointing left)
    arrow_points = [
        (center_x + arrow_size//2, center_y - arrow_size//2),  # top right
        (center_x + arrow_size//2, center_y + arrow_size//2),  # bottom right
        (center_x - arrow_size//2, center_y)                   # left point
    ]
    
    draw.polygon(arrow_points, fill=(255, 255, 255, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # Create icons for different sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        create_icon(size, f"icon{size}.png")
    
    print("All icons created successfully!")
