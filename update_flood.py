import re

with open('C:/Users/acer/Downloads/CITECH/frontend/src/main.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Replace single circle with dynamic circle rendering
old_circle_code = """      } else {
        layers.push(L.circle(data.loc, {
          radius: radius,
          color: data.color,
          fillColor: data.patternId || data.color,
          fillOpacity: data.patternId ? 1 : 0.25,
          weight: 3,
          opacity: 0.95,
          className: 'event-polygon'
        }));
      }"""

new_circle_code = """      } else {
        const isFlood = data.title.toLowerCase().includes('banjir');
        if (isFlood) {
            // Flexible, combined multi-circle animation for flood simulation
            const circles = [radius, radius * 0.6, radius * 0.3];
            circles.forEach((r, idx) => {
                layers.push(L.circle(data.loc, {
                  radius: r,
                  color: data.color,
                  fillColor: data.patternId || data.color,
                  fillOpacity: data.patternId ? 1 : (0.15 + (idx * 0.1)),
                  weight: 2,
                  opacity: 0.8,
                  className: 'flood-wave event-polygon'
                }));
            });
        } else {
            layers.push(L.circle(data.loc, {
              radius: radius,
              color: data.color,
              fillColor: data.patternId || data.color,
              fillOpacity: data.patternId ? 1 : 0.25,
              weight: 3,
              opacity: 0.95,
              className: 'event-polygon'
            }));
        }
      }"""
data = data.replace(old_circle_code, new_circle_code)

# Replace data.chartColor with data.color globally in Chart rendering
data = data.replace('data.chartColor', 'data.color')

with open('C:/Users/acer/Downloads/CITECH/frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(data)
print("Updated circle rendering and chart color sync.")
