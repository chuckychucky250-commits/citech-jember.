import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  let activePolygon = null;
  // --- 1. DARK MODE LOGIC ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  // Helper to apply theme
  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setMapTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setMapTheme('light');
    }
  }

  if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      applyTheme(isDark);
    });
  }

  if(themeToggleBtnMobile) {
    themeToggleBtnMobile.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      applyTheme(isDark);
    });
  }

  const closeOnboardingBtn = document.getElementById('closeOnboardingBtn');
  if (closeOnboardingBtn) {
    closeOnboardingBtn.addEventListener('click', () => {
      const toast = document.getElementById('onboardingToast');
      if (toast) toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
    });
  }

  // Mobile theme button (top-right on mobile)
  const mobileThemeBtn = document.getElementById('mobileThemeBtn');
  if(mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      applyTheme(isDark);
    });
  }

  // --- 2. MAP INITIALIZATION ---
  const jemberCenter = [-8.1724, 113.7000];
  const jemberBounds = L.latLngBounds([-8.6, 113.1], [-7.8, 114.2]); // Restrict strictly to Jember area

  const map = L.map('map', { 
    zoomControl: false,
    zoomAnimation: true,
    maxBounds: jemberBounds,
    maxBoundsViscosity: 1.0, // Strictly bounce back
    minZoom: 10
  }).setView([-4.0, 113.7000], 5);

  let tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  let geojsonLayer = null;

  function setMapTheme(theme) {
    map.removeLayer(tileLayer);
    const url = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    tileLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap & CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Update GeoJSON style dynamically based on theme
    if (geojsonLayer) {
      geojsonLayer.setStyle(getGeoJSONStyle(theme));
    }
  }

  function getGeoJSONStyle(theme) {
    return {
      color: theme === 'dark' ? '#ffffff' : '#475569', // White for dark, slate-600 for light
      weight: 1.5,
      opacity: 0.5,
      dashArray: '5, 5',
      fillOpacity: 0 // completely transparent inside
    };
  }

  if(document.documentElement.classList.contains('dark')) setMapTheme('dark');

  // Load GeoJSON Boundaries
  let jemberGeoJSONData = null;
  fetch('./data/jember-batas.geojson')
    .then(response => response.json())
    .then(data => {
      jemberGeoJSONData = data;
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      geojsonLayer = L.geoJSON(data, {
        style: getGeoJSONStyle(currentTheme)
      }).addTo(map);
      
    })
    .catch(err => console.log('Batas Jember GeoJSON not found, skipping.', err));


  // --- REALTIME DMS COORDINATES (Bottom Right) ---
  function toDMS(coordinate, isLat) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = coordinate >= 0 ? (isLat ? "N" : "E") : (isLat ? "S" : "W");
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

  const CoordinatesControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      this._container.className += ' hidden md:block px-3 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-md mb-6 mr-4 pointer-events-none';
      this._container.innerHTML = 'Hover on map...';
      return this._container;
    },
    update: function (lat, lng) {
      this._container.innerHTML = `${toDMS(lat, true)} &middot; ${toDMS(lng, false)}`;
    }
  });
  const coordsControl = new CoordinatesControl();
  map.addControl(coordsControl);

  // Default coordinate (center Jember)
  coordsControl.update(jemberCenter[0], jemberCenter[1]);

  // --- CUSTOM ZOOM CONTROLS (Bottom Right, above coordinates) ---
  const CustomZoomControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.style.background = 'transparent';
      container.style.border = 'none';
      container.style.boxShadow = 'none';
      container.innerHTML = `
        <div class="hidden md:flex flex-col space-y-2 mr-2 mb-2">
          <button id="mapZoomInBtn" class="w-10 h-10 bg-white/80 dark:bg-transparent backdrop-blur-md border border-slate-300 dark:border-white/30 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800/50 transition-all focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
          <button id="mapZoomOutBtn" class="w-10 h-10 bg-white/80 dark:bg-transparent backdrop-blur-md border border-slate-300 dark:border-white/30 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800/50 transition-all focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"></path></svg>
          </button>
        </div>
      `;
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });
  map.addControl(new CustomZoomControl());

  // Bind zoom events via delegation since they are injected
  document.addEventListener('click', (e) => {
    const inBtn = e.target.closest('#mapZoomInBtn');
    const outBtn = e.target.closest('#mapZoomOutBtn');
    if (inBtn) map.zoomIn();
    if (outBtn) map.zoomOut();
  });

  map.on('mousemove', function (e) {
    coordsControl.update(e.latlng.lat, e.latlng.lng);
  });

  // Invalidate map size after layout settles
  setTimeout(() => map.invalidateSize(), 300);
  window.addEventListener('resize', () => map.invalidateSize());

  // --- 3. DATASET ---
  // Shared backdrop overlay (declared early so all functions can use it)
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  document.body.appendChild(overlay);

  fetch('./data/events.json')
    .then(response => response.json())
    .then(eventsData => {
  const markerLayers = {};
  const markerRefs = {}; // id -> marker (for overlay management)
  const delayClasses = ['', 'delay-1', 'delay-2', 'delay-3', 'delay-4'];
  
  eventsData.forEach((data, idx) => {
    const delay = delayClasses[idx % delayClasses.length];
    const catClass = `marker-${data.category}`;
    const markerHtml = `<div class="w-4 h-4 rounded-full border-2 border-white shadow-lg pulse-marker ${delay} ${catClass}" style="background-color:${data.color}"></div>`;
    const icon = L.divIcon({ html: markerHtml, className: 'custom-div-icon', iconSize: [16, 16], iconAnchor: [8, 8] });
    const marker = L.marker(data.loc, { icon });
    
    // Tooltip on hover
    marker.bindTooltip(
      `<div style="font-family:Inter,sans-serif;line-height:1.3">
        <strong class="text-gray-900 dark:text-gray-100" style="font-size:12px;">${data.title}</strong>
        <span class="text-gray-500 dark:text-gray-400" style="display:block;font-size:10px;margin-top:1px">${data.year} &middot; ${data.category.charAt(0).toUpperCase()+data.category.slice(1)}</span>
      </div>`,
      { direction: 'top', offset: [0, -10], className: 'leaflet-tooltip-clean', permanent: false, sticky: false }
    );
    
    if (!markerLayers[data.category]) markerLayers[data.category] = L.layerGroup().addTo(map);
    markerLayers[data.category].addLayer(marker);
    markerRefs[data.id] = marker;
    
    // Start markers hidden for staggered fade in
    const markerEl = marker.getElement();
    if (markerEl) {
      markerEl.style.opacity = '0';
      markerEl.style.transition = 'opacity 1s ease-in-out';
    }
    
    marker.on('click', () => openPanel(data));
  });

  // --- Cinematic Entry Transition & Counter HUD Animation ---
  setTimeout(() => {
    // Reveal Cinematic Watermark
    const watermark = document.getElementById('cinematicWatermark');
    if (watermark) watermark.style.opacity = '1';

    // Cinematic flyTo Jember
    map.flyTo(jemberCenter, 11, {
      duration: 3.5,
      easeLinearity: 0.1
    });

    // Staggered marker fade in after map movement starts
    setTimeout(() => {
      let delayMs = 0;
      eventsData.forEach(data => {
        const marker = markerRefs[data.id];
        if (marker) {
          setTimeout(() => {
            const el = marker.getElement();
            if (el) el.style.opacity = '1';
          }, delayMs);
          delayMs += 100;
        }
      });
    }, 2000);

    // Counter HUD Animation
    const counterHUD = document.getElementById('counterHUD');
    if (counterHUD) counterHUD.style.opacity = '1';
    
    const counterEl = document.getElementById('totalEventsCounter');
    if (counterEl) {
      let startTimestamp = null;
      const duration = 2000;
      const targetVal = eventsData.length;
      
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        counterEl.textContent = Math.floor(progress * targetVal);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          counterEl.textContent = targetVal;
        }
      };
      window.requestAnimationFrame(step);
    }
  }, 500);

  // Filter Legend
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  filterCheckboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const category = e.target.value;
      if (e.target.checked) {
        if(markerLayers[category]) map.addLayer(markerLayers[category]);
      } else {
        if(markerLayers[category]) map.removeLayer(markerLayers[category]);
      }
    });
  });

  // --- 4. MULTI-WORKSPACE TABS ---
  const eventPanel = document.getElementById('eventPanel');
  const panelContent = document.getElementById('panelContent');
  const panelEmptyState = document.getElementById('panelEmptyState');
  const approvedContributionsArea = document.getElementById('approvedContributionsArea');
  const approvedList = document.getElementById('approvedList');
  
  let openedTabs = [];
  let activeTabId = null;
  let isMobilePanelExpanded = false;

  function openPanel(data) {
    if (panelContent) panelContent.classList.remove('hidden');
    const footer = document.getElementById('panelStickyFooter');
    if (footer) footer.classList.remove('hidden');
    if (panelEmptyState) panelEmptyState.classList.add('hidden');

    const onboardingToast = document.getElementById('onboardingToast');
    if(onboardingToast) onboardingToast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');

    // Dynamic data injection
    const elTitle = document.getElementById('eventTitle');
    if (elTitle) elTitle.textContent = data.title;

    const elKorban = document.getElementById('panelKorban');
    if (elKorban) elKorban.textContent = data.korban;

    const elLuasan = document.getElementById('panelLuasan');
    if (elLuasan) elLuasan.textContent = data.luasan;

    const elRingkasan = document.getElementById('panelRingkasan');
    if (elRingkasan) elRingkasan.textContent = data.ringkasan;
    
    const elCounter = document.getElementById('mobileEventCounter');
    if(elCounter) elCounter.textContent = `${eventsData.indexOf(data) + 1}/${eventsData.length}`;

    // Draw activePolygon (Removed square overlays to avoid visual clutter and duplicate boundary lines)
    if (activePolygon) {
      map.removeLayer(activePolygon);
      activePolygon = null;
    }

    // Animation logic
    if (window.innerWidth >= 768) {
      eventPanel.classList.remove('md:translate-x-full');
      eventPanel.style.height = ''; 
    } else {
      isMobilePanelExpanded = false;
      eventPanel.style.height = '50vh';
      eventPanel.classList.remove('translate-y-full');
      
      const expandBtn = document.getElementById('expandPanelBtn');
      if(expandBtn) {
        expandBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>';
        expandBtn.title = "Perbesar Panel";
      }
    }
    eventPanel.classList.remove('translate-x-full'); // fallback for grading

    // Calculate offset for map center
    const targetPoint = map.project(data.loc, 15);
    if (window.innerWidth >= 768) {
      targetPoint.x += 220; // Shift right by half the panel width (440px / 2) to center in visible area
    } else {
      targetPoint.y += (window.innerHeight * 0.25); // Shift down by 25vh to center in upper 50vh of screen
    }
    const targetLatLng = map.unproject(targetPoint, 15);

    // Deep Zoom on Click (Technical Map Zoom)
    map.flyTo(targetLatLng, 15, {
      duration: 1.5,
      easeLinearity: 0.25
    });

    const exists = openedTabs.find(tab => tab.id === data.id);
    if (!exists) {
      if(openedTabs.length >= 8) openedTabs.shift();
      openedTabs.push(data);
    }
    
    // Save to history
    saveToHistory(data.id);
    
    switchTab(data.id);
  }

  // Map overlay circle tracking
  let activeOverlay = null;

  function updateMapOverlay(data, milestoneIdx) {
    if (activeOverlay) { map.removeLayer(activeOverlay); activeOverlay = null; }
    const m = data.milestones[milestoneIdx];
    if (!m) return;
    
    // Render all types as a glowing point/area to avoid user confusion with lines
    const radius = m.polygonRadius || 250; // default radius if missing
    
    // We will collect multiple layers in a featureGroup or just array so we can remove them later
    // Actually, we can assign a L.featureGroup to activeOverlay to group lines and dots
    const layers = [];
    
    if (data.renderType === 'area' || !data.renderType) {
      // Draw actual polygon overlay instead of simple circle
      if (data.area_polygon) {
        layers.push(L.polygon(data.area_polygon, {
          color: data.color,
          fillColor: data.color,
          fillOpacity: 0.25,
          weight: 2,
          opacity: 0.8,
          className: 'event-polygon'
        }));
      } else {
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
      }
    } else if (data.renderType === 'network') {
      if (m.networkCoords) {
        // Draw center dot
        layers.push(L.circleMarker(data.loc, { radius: 8, color: data.color, fillColor: data.color, fillOpacity: 0.85, weight: 2.5 }));
        
        m.networkCoords.forEach(coord => {
          // Line to center
          layers.push(L.polyline([data.loc, coord], {
            color: data.color,
            weight: 2.5,
            opacity: 0.9,
            className: 'event-network'
          }));
          // Small dot at the end
          layers.push(L.circleMarker(coord, { radius: 4, color: data.color, fillColor: '#fff', fillOpacity: 1, weight: 2 }));
        });
      }
    } else if (data.renderType === 'route') {
      if (m.routeCoords) {
        // Draw the main line
        layers.push(L.polyline(m.routeCoords, {
          color: data.color,
          weight: 4,
          opacity: 0.95,
          className: 'event-route'
        }));
        
        // Draw a dot at each point along the route
        m.routeCoords.forEach((coord, idx) => {
           const isStartOrEnd = idx === 0 || idx === m.routeCoords.length - 1;
           layers.push(L.circleMarker(coord, { 
             radius: isStartOrEnd ? 6 : 4, 
             color: data.color, 
             fillColor: isStartOrEnd ? data.color : '#fff', 
             fillOpacity: 1, 
             weight: 2 
           }));
        });
      }
    } else if (data.renderType === 'point') {
      // Just a small, distinct circle marker for single-point events (no large geographical circle or hatching)
      layers.push(L.circleMarker(data.loc, {
        radius: 8,
        color: data.color,
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 3,
        opacity: 0.95,
        className: 'event-point'
      }));
    }
    
    // Add permanent tooltips for spatial flow labels
    if (m.spatialDesc && m.spatialDesc.length > 0) {
      m.spatialDesc.forEach(desc => {
        if (desc.loc) {
          const t = L.tooltip({ 
            permanent: true, 
            direction: 'right', 
            className: 'spatial-flow-tooltip',
            offset: [10, 0]
          })
          .setLatLng(desc.loc)
          .setContent(`<b>${desc.title.split('(')[0].trim()}</b>`);
          layers.push(t);
        }
      });
    }
    
    if (layers.length > 0) {
       activeOverlay = L.layerGroup(layers).addTo(map);
    }
  }

  // Chart.js instance tracker
  let activeChart = null;

  function renderEventChart(data) {
    const canvas = document.getElementById('eventChart');
    if (!canvas) return;
    if (activeChart) { activeChart.destroy(); activeChart = null; }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#1f2937' : '#f3f4f6';
    
    const isArea = data.chartType === 'area';
    const type = isArea ? 'line' : data.chartType;

    activeChart = new Chart(canvas, {
      type: type,
      data: {
        labels: data.chartLabels,
        datasets: [{
          label: data.chartLabel,
          data: data.chartData,
          backgroundColor: isArea
            ? `${data.color}33`
            : data.chartType === 'line' ? 'transparent' : `${data.color}cc`,
          borderColor: data.color,
          borderWidth: 2,
          fill: isArea,
          tension: 0.4,
          pointBackgroundColor: data.color,
          pointRadius: type === 'line' ? 4 : 0,
          pointHoverRadius: type === 'line' ? 6 : 0,
          borderRadius: type === 'bar' ? 6 : 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            titleColor: isDark ? '#f9fafb' : '#111827',
            bodyColor: isDark ? '#9ca3af' : '#6b7280',
            borderColor: isDark ? '#1f2937' : '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor }, beginAtZero: true }
        }
      }
    });
  }

  function applyMilestone(data, milestoneIdx) {
    const m = data.milestones[milestoneIdx];
    if (!m) return;
    
    // Update stats
    const stat1Value = document.getElementById('panelKorban');
    if (stat1Value) stat1Value.textContent = m.stat1V;
    
    const stat2Value = document.getElementById('panelLuasan');
    if (stat2Value) stat2Value.textContent = m.stat2V;
    
    // Update narasi
    const tlNarasi = document.getElementById('timelineMilestoneNarasi');
    if (tlNarasi) tlNarasi.textContent = m.narasi;
    
    const tlLabel = document.getElementById('timelineMilestoneLabel');
    if (tlLabel) tlLabel.textContent = m.tag;
    
    // Spatial Flow interpretation specific to this milestone
    const spatialArea = document.getElementById('spatialFlowArea');
    const spatialList = document.getElementById('spatialFlowList');
    if (spatialArea && spatialList) {
      if (m.spatialDesc && m.spatialDesc.length > 0) {
        spatialArea.classList.remove('hidden');
        spatialList.innerHTML = '';
        m.spatialDesc.forEach((step, idx) => {
          const item = document.createElement('div');
          item.className = 'relative';
          
          const dot = document.createElement('div');
          dot.className = 'absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-white dark:border-gray-900';
          dot.style.backgroundColor = data.color;
          item.appendChild(dot);
          
          const title = document.createElement('h5');
          title.className = 'text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5';
          title.textContent = step.title;
          item.appendChild(title);
          
          const desc = document.createElement('p');
          desc.className = 'text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed';
          desc.textContent = step.desc;
          item.appendChild(desc);
          
          spatialList.appendChild(item);
        });
      } else {
        spatialArea.classList.add('hidden');
        spatialList.innerHTML = '';
      }
    }
    
    // Update map overlay
    updateMapOverlay(data, milestoneIdx);
  }

  function renderTimeline(data, activeIdx) {
    const nodeTrack = document.getElementById('timelineNodeTrack');
    const labels = document.getElementById('timelineLabels');
    const tlContainer = document.getElementById('chapter-timeline');
    
    if (!data.milestones || data.milestones.length <= 1) {
      if (tlContainer) tlContainer.classList.add('hidden');
      return;
    }
    if (tlContainer) tlContainer.classList.remove('hidden');
    
    const maxIdx = data.milestones.length - 1;
    if (activeIdx === undefined) {
      activeIdx = data.peakMilestoneIdx ?? Math.floor(maxIdx / 2);
    }

    // Render node track dots
    if (nodeTrack) {
      nodeTrack.innerHTML = '';
      data.milestones.forEach((m, i) => {
        const nodeWrap = document.createElement('div');
        nodeWrap.className = 'flex-1 flex justify-center relative cursor-pointer group';
        nodeWrap.addEventListener('click', () => {
           applyMilestone(data, i);
           renderTimeline(data, i);
        });

        const dot = document.createElement('div');
        dot.className = `timeline-node z-10 relative transition-transform duration-300 ${i === activeIdx ? 'active scale-125' : 'group-hover:scale-110'}`;
        dot.style.borderWidth = '2px';
        
        if (i === activeIdx) {
          dot.style.backgroundColor = data.color;
          dot.style.boxShadow = `0 0 0 4px ${data.color}30, 0 0 0 1px ${data.color}`;
          dot.style.borderColor = 'white';
        } else {
          dot.style.backgroundColor = i < activeIdx ? data.color : '#e5e7eb';
          dot.style.borderColor = i < activeIdx ? data.color : '#d1d5db';
          dot.style.boxShadow = 'none';
        }
        nodeWrap.appendChild(dot);

        // Draw connector line between dots
        if (i < maxIdx) {
          const line = document.createElement('div');
          line.className = 'h-1 self-center absolute left-[50%] right-[-50%] z-0 transition-colors duration-300';
          const isPast = i < activeIdx;
          line.style.background = isPast ? data.color : '#e5e7eb';
          nodeWrap.appendChild(line);
        }
        
        nodeTrack.appendChild(nodeWrap);
      });
    }

    // Render labels
    if (labels) {
      labels.innerHTML = '';
      data.milestones.forEach((m, i) => {
        const span = document.createElement('span');
        span.textContent = m.label;
        const isActive = i === activeIdx;
        span.className = `text-[11px] ${isActive ? 'font-bold' : 'text-gray-400 font-medium cursor-pointer hover:text-gray-600'} transition-colors`;
        if (isActive) span.style.color = data.color;
        span.addEventListener('click', () => {
           applyMilestone(data, i);
           renderTimeline(data, i);
        });
        labels.appendChild(span);
      });
    }
  }

  // --- GLOBAL EVENT LISTENERS FOR PANEL CONTROLS ---
  const expandPanelBtn = document.getElementById('expandPanelBtn');
  const closePanelBtn = document.getElementById('closePanelBtn');
  
  if (expandPanelBtn) {
    expandPanelBtn.addEventListener('click', () => {
      if (window.innerWidth >= 768) {
        if (eventPanel.classList.contains('md:w-[440px]')) {
          eventPanel.classList.replace('md:w-[440px]', 'md:w-[80vw]');
          eventPanel.classList.replace('lg:w-[480px]', 'lg:w-[85vw]');
          expandPanelBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5M4 10V6m0 0h4m-4 0l5 5m11-5v4m0-4h-4m4 0l-5 5"></path></svg>';
          expandPanelBtn.title = "Perkecil Panel";
        } else {
          eventPanel.classList.replace('md:w-[80vw]', 'md:w-[440px]');
          eventPanel.classList.replace('lg:w-[85vw]', 'lg:w-[480px]');
          expandPanelBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>';
          expandPanelBtn.title = "Perbesar Panel";
        }
      } else {
        isMobilePanelExpanded = !isMobilePanelExpanded;
        eventPanel.style.height = isMobilePanelExpanded ? '88vh' : '50vh';
        updateExpandIcon();
      }
    });
  }

  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', () => {
      closePanel();
    });
  }

  function switchTab(id) {
    activeTabId = id;
    renderTabs();
    updateBookmarkIconState(id);
    
    const activeData = eventsData.find(evt => evt.id === id);
    if (activeData) {
      if(panelEmptyState) panelEmptyState.classList.add('hidden');
      if(panelContentArea) panelContentArea.classList.remove('hidden');
      const footer = document.getElementById('panelStickyFooter');
      if(footer) footer.classList.remove('hidden');

      const elTitle = document.getElementById('eventTitle');
      if(elTitle) elTitle.textContent = activeData.title;
      
      const elYear = document.getElementById('eventYear');
      if(elYear) elYear.textContent = `TAHUN ${activeData.year}`;
      
      const elCatBadge = document.getElementById('eventCategoryBadge');
      if(elCatBadge) elCatBadge.textContent = activeData.category;
      
      const elCatDot = document.getElementById('eventCategoryDot');
      if(elCatDot) elCatDot.style.backgroundColor = activeData.color;
      
      // Original mappings
      const heroImgElem = document.getElementById('eventHeroImg');
      if(heroImgElem) heroImgElem.src = activeData.heroImage || activeData.gambar;
      
      // New requested mappings
      const elStat1Label = document.getElementById('stat1Label');
      if(elStat1Label) elStat1Label.textContent = activeData.stat1Label || 'Dampak Korban';
      
      const elStat1Value = document.getElementById('panelKorban');
      if(elStat1Value) elStat1Value.textContent = activeData.korban !== undefined ? activeData.korban : '—';
      
      const stat1Unit = document.getElementById('stat1Unit');
      if(stat1Unit) stat1Unit.textContent = activeData.stat1Unit || 'Jiwa';
      
      const elStat2Label = document.getElementById('stat2Label');
      if(elStat2Label) elStat2Label.textContent = activeData.stat2Label || 'Area Terdampak';
      
      const elStat2Value = document.getElementById('panelLuasan');
      if(elStat2Value) elStat2Value.textContent = activeData.luasan !== undefined ? activeData.luasan : '—';
      
      const stat2Unit = document.getElementById('stat2Unit');
      if(stat2Unit) stat2Unit.textContent = activeData.stat2Unit || 'Ha';
      
      const elEventQuote = document.getElementById('eventQuote');
      if(elEventQuote) elEventQuote.textContent = activeData.quote || '"Data historis Jember"';
      
      const elEventQuoteAuthor = document.getElementById('eventQuoteAuthor');
      if(elEventQuoteAuthor) elEventQuoteAuthor.textContent = activeData.quoteAuthor || '— Arsip Publik';
      
      const desc1 = document.getElementById('panelRingkasan');
      if(desc1) desc1.textContent = activeData.ringkasan || activeData.desc1;
      
      const desc2 = document.getElementById('eventDesc2');
      if(desc2) desc2.textContent = activeData.desc2 || '';
      
      // Update coordinates
      const elCoords = document.getElementById('eventCoordinates');
      if(elCoords) {
        const lat = activeData.loc[0];
        const lng = activeData.loc[1];
        // Format to DMS
        const formatDMS = (val, isLat) => {
          const absolute = Math.abs(val);
          const degrees = Math.floor(absolute);
          const minutesNotTruncated = (absolute - degrees) * 60;
          const minutes = Math.floor(minutesNotTruncated);
          const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
          let dir = '';
          if(isLat) dir = val >= 0 ? 'N' : 'S';
          else dir = val >= 0 ? 'E' : 'W';
          return `${degrees}°${minutes}'${seconds}"${dir}`;
        };
        elCoords.textContent = `${formatDMS(lat, true)} ${formatDMS(lng, false)}`;
      }

      // Copy Coordinates Button
      const copyCoordsBtn = document.getElementById('copyCoordsBtn');
      if(copyCoordsBtn) {
        // Remove old listeners by cloning
        const newCopyBtn = copyCoordsBtn.cloneNode(true);
        copyCoordsBtn.parentNode.replaceChild(newCopyBtn, copyCoordsBtn);
        
        newCopyBtn.addEventListener('click', () => {
          if (elCoords && elCoords.textContent) {
            navigator.clipboard.writeText(elCoords.textContent).then(() => {
              const tooltip = newCopyBtn.querySelector('#copyCoordsTooltip');
              if (tooltip) {
                tooltip.textContent = "Koordinat berhasil disalin!";
                setTimeout(() => {
                  tooltip.textContent = "Copy";
                }, 2000);
              }
            });
          }
        });
      }

      // Render chart
      renderEventChart(activeData);

      // Timeline & Milestone logic (this will automatically populate spatialFlowArea)
      if(activeData.milestones) {
        const peakIdx = activeData.peakMilestoneIdx ?? 1;
        renderTimeline(activeData);
        applyMilestone(activeData, peakIdx);
      }

      // Chart
      if(activeData.chartType) {
        renderEventChart(activeData);
      }

      // Approved contributions
      if (window.approvedAdminContributions && window.approvedAdminContributions[id]) {
        approvedContributionsArea.classList.remove('hidden');
        approvedList.innerHTML = '';
        window.approvedAdminContributions[id].forEach(contrib => {
          approvedList.innerHTML += `
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div class="absolute right-0 top-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center shadow-sm">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Verified
              </div>
              <p class="text-xs text-gray-500 mb-1 font-bold">${contrib.name} <span class="font-normal font-mono float-right mr-16">${contrib.ticket}</span></p>
              <p class="text-sm text-gray-700 dark:text-gray-300 italic">"${contrib.story}"</p>
            </div>
          `;
        });
      } else {
        approvedContributionsArea.classList.add('hidden');
        approvedList.innerHTML = '';
      }

      document.getElementById('contributeContextTitle').textContent = `Mengajukan bukti untuk: ${activeData.title}`;

      // Fly to
      if (!window.isMapLocked) {
        map.flyTo(activeData.loc, 14, { duration: 1.5, easeLinearity: 0.2 });
        map.once('moveend', () => {
          if (window.innerWidth >= 768) map.panBy([200, 0], { animate: true, duration: 0.5 });
          else map.panBy([0, 150], { animate: true, duration: 0.5 });
        });
      }
    }
  }

  function closeTab(e, id) {
    e.stopPropagation();
    openedTabs = openedTabs.filter(tab => tab.id !== id);
    if (openedTabs.length === 0) {
      activeTabId = null;
      renderTabs();
      panelEmptyState.classList.remove('hidden');
      panelContentArea.classList.add('hidden');
      const footer = document.getElementById('panelStickyFooter');
      if(footer) footer.classList.add('hidden');
    } else if (activeTabId === id) {
      switchTab(openedTabs[openedTabs.length - 1].id);
    } else {
      renderTabs();
      panelEmptyState.classList.add('hidden');
      if(panelContentArea) panelContentArea.classList.remove('hidden');
      const footer = document.getElementById('panelStickyFooter');
      if(footer) footer.classList.remove('hidden');
    }
  }

  function renderTabs() {
    tabsContainer.innerHTML = '';
    openedTabs.forEach(tab => {
      const isActive = tab.id === activeTabId;
      const tabEl = document.createElement('div');
      // Truncate title if many tabs open
      const manyTabs = openedTabs.length > 3;
      const shortTitle = manyTabs && tab.title.length > 10 ? tab.title.slice(0, 10) + '…' : tab.title;
      tabEl.className = `px-4 py-3 text-[13px] font-semibold cursor-pointer tracking-wide flex items-center transition-all shrink-0 ${
        manyTabs ? 'max-w-[120px]' : 'max-w-[150px]'
      }`;
      
      if (isActive) {
        tabEl.classList.add('text-gray-900', 'dark:text-white');
        tabEl.style.borderBottom = `2px solid currentColor`; 
      } else {
        tabEl.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:hover:text-gray-300');
        tabEl.style.borderBottom = `2px solid transparent`;
      }
      
      tabEl.title = tab.title; // full title in native tooltip
      tabEl.innerHTML = `
        <span class="w-3.5 h-1.5 rounded-full shrink-0 mr-2" style="background-color:${tab.color}"></span>
        <span class="truncate flex-1">${shortTitle}</span>
        <button class="ml-2 text-gray-400 hover:text-red-500 transition-colors close-tab-btn outline-none shrink-0">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      `;
      tabEl.addEventListener('click', () => switchTab(tab.id));
      tabEl.querySelector('.close-tab-btn').addEventListener('click', (e) => closeTab(e, tab.id));
      tabsContainer.appendChild(tabEl);
    });
  }

  // --- 5. LOCAL STORAGE: HISTORY & BOOKMARK ---
  let historyCache = JSON.parse(localStorage.getItem('eventHistory') || '[]');
  let bookmarkCache = JSON.parse(localStorage.getItem('eventBookmarks') || '[]');

  function saveToHistory(id) {
    historyCache = historyCache.filter(item => item !== id); // remove if exists
    historyCache.unshift(id); // add to top
    if(historyCache.length > 10) historyCache.pop(); // keep last 10
    localStorage.setItem('eventHistory', JSON.stringify(historyCache));
    renderHistory();
  }

  function toggleBookmark(id) {
    if(bookmarkCache.includes(id)) {
      bookmarkCache = bookmarkCache.filter(item => item !== id);
    } else {
      bookmarkCache.push(id);
    }
    localStorage.setItem('eventBookmarks', JSON.stringify(bookmarkCache));
    updateBookmarkIconState(id);
    renderBookmarks();
  }

  const bookmarkEventBtn = document.getElementById('bookmarkEventBtn');
  if(bookmarkEventBtn) {
    bookmarkEventBtn.addEventListener('click', () => {
      if(activeTabId) toggleBookmark(activeTabId);
    });
  }

  function updateBookmarkIconState(id) {
    if(!bookmarkEventBtn) return;
    if(bookmarkCache.includes(id)) {
      bookmarkEventBtn.classList.add('text-yellow-500', 'border-yellow-200');
      bookmarkEventBtn.classList.remove('text-gray-400');
      bookmarkEventBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';
    } else {
      bookmarkEventBtn.classList.remove('text-yellow-500', 'border-yellow-200');
      bookmarkEventBtn.classList.add('text-gray-400');
      bookmarkEventBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';
    }
  }

  // --- 6. DEEP LINKING (SHARE) ---
  const shareEventBtn = document.getElementById('shareEventBtn');
  const copyToast = document.getElementById('copyToast');
  if(shareEventBtn) {
    shareEventBtn.addEventListener('click', () => {
      if(activeTabId) {
        const url = new URL(window.location);
        url.searchParams.set('event', activeTabId);
        navigator.clipboard.writeText(url.toString()).then(() => {
          copyToast.classList.remove('opacity-0', '-translate-y-10');
          setTimeout(() => {
            copyToast.classList.add('opacity-0', '-translate-y-10');
          }, 3000);
        });
      }
    });
  }

  // Check URL on load
  const urlParams = new URLSearchParams(window.location.search);
  const deepLinkEventId = urlParams.get('event');
  if(deepLinkEventId) {
    const evt = eventsData.find(e => e.id === deepLinkEventId);
    if(evt) {
      setTimeout(() => openPanel(evt), 500);
    }
  }

  // Show onboarding toast
  setTimeout(() => {
    // Reveal Onboarding Toast
    const onboardingToast = document.getElementById('onboardingToast');
    if (onboardingToast) {
      onboardingToast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
      // Auto-hide after 6 seconds
      setTimeout(() => {
        onboardingToast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
      }, 6000);
    }
  }, 1200);

  // --- 6b. ARCHIVE TABS in Event Panel ---
  document.querySelectorAll('.archive-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.archive;
      // Update button styles
      document.querySelectorAll('.archive-tab-btn').forEach(b => {
        b.classList.remove('font-bold', 'text-gray-800', 'dark:text-white', 'border-gray-800', 'dark:border-white');
        b.classList.add('font-medium', 'text-gray-400', 'border-transparent');
      });
      btn.classList.remove('font-medium', 'text-gray-400', 'border-transparent');
      btn.classList.add('font-bold', 'text-gray-800', 'dark:text-white', 'border-gray-800', 'dark:border-white');
      // Show the right content
      document.querySelectorAll('.archive-tab-content').forEach(c => c.classList.add('hidden'));
      const targetEl = document.getElementById(`archive-${target}`);
      if(targetEl) targetEl.classList.remove('hidden');
    });
  });

  // Drag-to-scroll for Archive Tabs
  const archiveTabsBar = document.getElementById('archiveTabsBar');
  if (archiveTabsBar) {
    let isDown = false;
    let startX;
    let scrollLeft;
    archiveTabsBar.addEventListener('mousedown', (e) => {
      isDown = true;
      archiveTabsBar.style.cursor = 'grabbing';
      startX = e.pageX - archiveTabsBar.offsetLeft;
      scrollLeft = archiveTabsBar.scrollLeft;
    });
    archiveTabsBar.addEventListener('mouseleave', () => {
      isDown = false;
      archiveTabsBar.style.cursor = 'grab';
    });
    archiveTabsBar.addEventListener('mouseup', () => {
      isDown = false;
      archiveTabsBar.style.cursor = 'grab';
    });
    archiveTabsBar.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - archiveTabsBar.offsetLeft;
      const walk = (x - startX) * 2;
      archiveTabsBar.scrollLeft = scrollLeft - walk;
    });
  }

  // --- 6c. LAPORKAN LOKASI BARU ---
  const reportPanel = document.getElementById('reportPanel');
  const reportLocInfo = document.getElementById('reportLocInfo');
  const reportLocText = document.getElementById('reportLocText');

  // Jember bounding box for validation (fallback if turf not ready)
  const jemberBoundsCheck = L.latLngBounds([-8.6, 113.1], [-7.8, 114.2]);

  function pointInPolygon(point, vs) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  }

  function isPointInJember(latlng) {
    if (jemberGeoJSONData && jemberGeoJSONData.features) {
      const pt = [latlng.lng, latlng.lat];
      for (let f of jemberGeoJSONData.features) {
        if (f.geometry && f.geometry.type === 'Polygon') {
          if (pointInPolygon(pt, f.geometry.coordinates[0])) return true;
        } else if (f.geometry && f.geometry.type === 'MultiPolygon') {
          for (let poly of f.geometry.coordinates) {
            if (pointInPolygon(pt, poly[0])) return true;
          }
        }
      }
      return false; // If GeoJSON loaded and it didn't match, strictly reject
    }
    return jemberBoundsCheck.contains(latlng);
  }

  let reportMode = false;
  let reportMarker = null;
  let selectedReportLoc = null;

  function showOutsideJemberWarning() {
    let warn = document.getElementById('outsideJemberToast');
    if (!warn) {
      warn = document.createElement('div');
      warn.id = 'outsideJemberToast';
      warn.className = 'fixed top-24 md:top-8 left-0 right-0 mx-auto z-[3000] bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3 transition-all duration-300 w-max max-w-[90vw] sm:max-w-sm pointer-events-none opacity-0';
      warn.innerHTML = `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="leading-snug whitespace-normal text-left">Lokasi berada di luar Jember. Harap pilih titik dalam wilayah Kabupaten Jember.</span>`;
      document.body.appendChild(warn);
    }
    // Need a tiny delay for CSS transition if just created
    setTimeout(() => {
      warn.style.opacity = '1';
      warn.style.transform = 'translateY(0)';
    }, 10);
    clearTimeout(warn._timeout);
    warn._timeout = setTimeout(() => {
      warn.style.opacity = '0';
      warn.style.transform = 'translateY(-20px)';
    }, 4000);
  }

  function openReportPanelFn() {
    if (!reportPanel) return;
    if (window.innerWidth >= 768) {
      reportPanel.classList.remove('md:translate-x-full');
    } else {
      reportPanel.classList.remove('translate-y-full');
      if (overlay) { overlay.classList.add('active'); overlay.onclick = () => { overlay.classList.remove('active'); closeReportPanelFn(); }; }
    }
    reportMode = true;
    map.getContainer().style.cursor = 'crosshair';
  }

  function closeReportPanelFn() {
    if (!reportPanel) return;
    if (window.innerWidth >= 768) {
      reportPanel.classList.add('md:translate-x-full');
    } else {
      reportPanel.classList.add('translate-y-full');
    }
    if (overlay) overlay.classList.remove('active');
    reportMode = false;
    document.body.style.cursor = '';
    map.getContainer().style.cursor = '';
    if(reportMarker) { map.removeLayer(reportMarker); reportMarker = null; }
    selectedReportLoc = null;
    if (reportLocInfo) reportLocInfo.classList.add('hidden');
  }

  // Bind all report open buttons (desktop sidebar + mobile nav)
  ['openReportBtn', 'mobileReportBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openReportPanelFn);
  });

  const closeReportBtnEl = document.getElementById('closeReportBtn');
  if (closeReportBtnEl) closeReportBtnEl.addEventListener('click', closeReportPanelFn);

  const applyCoordBtn = document.getElementById('applyCoordBtn');
  const reportCoordinates = document.getElementById('reportCoordinates');
  const coordFeedback = document.getElementById('coordFeedback');

  if(applyCoordBtn && reportCoordinates) {
    applyCoordBtn.addEventListener('click', () => {
      const val = reportCoordinates.value.trim();
      if(!val) return;
      
      let lat = null, lng = null;
      
      // Coba format DMS: 8°15'0.0"S 113°50'60.0"E
      const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d\.]+)[”"']?\s*([NS])\s*(\d+)[°\s]+(\d+)['\s]+([\d\.]+)[”"']?\s*([EW])/i;
      const dmsMatch = val.match(dmsRegex);
      
      if (dmsMatch) {
        lat = parseInt(dmsMatch[1]) + parseInt(dmsMatch[2])/60 + parseFloat(dmsMatch[3])/3600;
        if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
        
        lng = parseInt(dmsMatch[5]) + parseInt(dmsMatch[6])/60 + parseFloat(dmsMatch[7])/3600;
        if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
      } else {
        // Coba format desimal: -8.172, 113.702
        const decRegex = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;
        const decMatch = val.match(decRegex);
        if (decMatch) {
          lat = parseFloat(decMatch[1]);
          lng = parseFloat(decMatch[2]);
        }
      }
      
      if (lat !== null && lng !== null) {
        
        selectedReportLoc = L.latLng(lat, lng);

        if (!isPointInJember(selectedReportLoc)) {
          showOutsideJemberWarning();
          coordFeedback.textContent = "✗ Lokasi di luar Kabupaten Jember.";
          coordFeedback.className = "text-[10px] mt-2 block text-red-600 dark:text-red-400 transition-all duration-300";
          return;
        }
        
        if(reportMarker) map.removeLayer(reportMarker);
        
        const icon = L.divIcon({ 
          html: '<div class="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', 
          className: 'custom-div-icon', iconSize: [20, 20], iconAnchor: [10, 10] 
        });
        reportMarker = L.marker(selectedReportLoc, { icon }).addTo(map);
        reportMarker.bindPopup('<span class="text-sm font-medium">Lokasi Laporan Anda</span>').openPopup();

        reportLocText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        reportLocInfo.classList.remove('hidden');
        
        map.flyTo(selectedReportLoc, 15, { duration: 1.5 });
        
        coordFeedback.textContent = "✓ Titik berhasil diatur pada peta.";
        coordFeedback.className = "text-[10px] mt-2 block text-emerald-600 dark:text-emerald-400 transition-all duration-300";
        
        setTimeout(() => {
          coordFeedback.classList.replace('block', 'hidden');
        }, 4000);
      } else {
        coordFeedback.textContent = "✗ Format tidak valid. Gunakan format: -8.123, 113.123";
        coordFeedback.className = "text-[10px] mt-2 block text-red-600 dark:text-red-400 transition-all duration-300";
      }
    });
  }

  // Map click to place report marker
  map.on('click', (e) => {
    if(!reportMode) return;
    // Check if click is inside Jember bounds
    if (!isPointInJember(e.latlng)) {
      showOutsideJemberWarning();
      return;
    }
    if(reportMarker) map.removeLayer(reportMarker);
    selectedReportLoc = e.latlng;
    
    const icon = L.divIcon({ 
      html: '<div class="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', 
      className: 'custom-div-icon', iconSize: [20, 20], iconAnchor: [10, 10] 
    });
    reportMarker = L.marker(e.latlng, { icon }).addTo(map);
    reportMarker.bindPopup('<span class="text-sm font-medium">Lokasi Laporan Anda</span>').openPopup();

    if (reportLocText) reportLocText.textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    if (reportLocInfo) reportLocInfo.classList.remove('hidden');

    // Re-open panel automatically after picking location
    if (reportPanel) {
      if (window.innerWidth >= 768) {
        reportPanel.classList.remove('md:translate-x-full');
      } else {
        reportPanel.classList.remove('translate-y-full');
        if (overlay) { overlay.classList.add('active'); overlay.onclick = () => { overlay.classList.remove('active'); closeReportPanelFn(); }; }
      }
    }
  });

  const pickMapBtn = document.getElementById('pickMapBtn');
  if (pickMapBtn) {
    pickMapBtn.addEventListener('click', () => {
      if (!reportPanel) return;
      if (window.innerWidth >= 768) {
        reportPanel.classList.add('md:translate-x-full');
      } else {
        reportPanel.classList.add('translate-y-full');
        if (overlay) overlay.classList.remove('active');
      }
      showToast('Mode Pilih Peta: Silakan ketuk titik di peta.', 'success');
    });
  }


  const submitReportBtn = document.getElementById('submitReportBtn');
  if(submitReportBtn) {
    submitReportBtn.addEventListener('click', () => {
      const title = document.getElementById('reportTitle')?.value || '';
      if(!selectedReportLoc) {
        showToast('Ketuk titik di peta terlebih dahulu untuk menentukan lokasi peristiwa.', 'warning');
        return;
      }
      if(!title.trim()) {
        showToast('Harap isi Judul / Nama Peristiwa.', 'warning');
        return;
      }
      
      const submission = {
        title: title,
        name: document.getElementById('reporterName')?.value || 'Anonim',
        category: document.getElementById('reportCategory')?.value || 'lainnya',
        year: document.getElementById('reportYear')?.value || '',
        desc: document.getElementById('reportDesc')?.value || '',
        source: document.getElementById('reportSource')?.value || '',
        loc: [selectedReportLoc.lat, selectedReportLoc.lng]
      };

      if(!window.reportQueue) window.reportQueue = [];
      window.reportQueue.push(submission);

      closeReportPanelFn();
      ['reportTitle','reporterName','reportDesc','reportYear','reportSource'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
      });
      
      showToast('Laporan berhasil dikirim! Menunggu verifikasi.', 'success');
    });
  }

  // Shared toast helper
  function showToast(message, type = 'success') {
    const toast = document.getElementById('copyToast');
    if (!toast) return;
    toast.textContent = message;
    
    // Position differently on mobile (bottom or mid) to avoid top nav overlap, and fix width
    toast.className = `fixed top-24 md:top-6 left-0 right-0 mx-auto z-[4000] px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 text-sm font-medium text-white w-max max-w-[90vw] sm:max-w-sm text-center leading-snug pointer-events-none`;
    
    if (type === 'success') toast.classList.add('bg-emerald-600');
    else if (type === 'warning') toast.classList.add('bg-orange-500');
    else toast.classList.add('bg-gray-800');
    
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
    }, 3500);
  }

  // --- 7. PERSONAL MENU (SLIDE-OUT / BOTTOM SHEET) ---
  const personalPanel = document.getElementById('personalPanel');
  const tabHistory = document.getElementById('tabHistory');
  const tabBookmarks = document.getElementById('tabBookmarks');
  const tabLibrary = document.getElementById('tabLibrary');
  const contentHistory = document.getElementById('contentHistory');
  const contentBookmarks = document.getElementById('contentBookmarks');
  const contentLibrary = document.getElementById('contentLibrary');

  function openPersonalPanelFn() {
    if (!personalPanel) return;
    if (window.innerWidth >= 768) {
      personalPanel.classList.remove('md:-translate-x-full');
    } else {
      personalPanel.classList.remove('translate-y-full');
      if (overlay) { overlay.classList.add('active'); overlay.onclick = () => { overlay.classList.remove('active'); closePersonalPanelFn(); }; }
    }
    renderHistory();
    renderBookmarks();
    renderLibrary();
  }

  function closePersonalPanelFn() {
    if (!personalPanel) return;
    if (window.innerWidth >= 768) {
      personalPanel.classList.add('md:-translate-x-full');
    } else {
      personalPanel.classList.add('translate-y-full');
    }
    if (overlay) overlay.classList.remove('active');
  }

  // Bind all personal panel open buttons (desktop sidebar + mobile nav)
  ['personalMenuBtn', 'mobilePersonalBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openPersonalPanelFn);
  });

  const closePersonalBtnEl = document.getElementById('closePersonalBtn');
  if (closePersonalBtnEl) closePersonalBtnEl.addEventListener('click', closePersonalPanelFn);

  function switchPersonalTab(activeBtn, activeContent) {
    [tabHistory, tabBookmarks, tabLibrary].forEach(btn => {
      btn.classList.remove('border-gray-900', 'dark:border-white', 'text-gray-900', 'dark:text-white');
      btn.classList.add('border-transparent', 'text-gray-500');
    });
    activeBtn.classList.remove('border-transparent', 'text-gray-500');
    activeBtn.classList.add('border-gray-900', 'dark:border-white', 'text-gray-900', 'dark:text-white');

    [contentHistory, contentBookmarks, contentLibrary].forEach(cnt => cnt.classList.add('hidden'));
    activeContent.classList.remove('hidden');
  }

  tabHistory.addEventListener('click', () => switchPersonalTab(tabHistory, contentHistory));
  tabBookmarks.addEventListener('click', () => switchPersonalTab(tabBookmarks, contentBookmarks));
  tabLibrary.addEventListener('click', () => switchPersonalTab(tabLibrary, contentLibrary));

  function createListItem(evt) {
    const div = document.createElement('div');
    div.className = 'px-3 py-2 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between group';
    div.innerHTML = `
      <div>
        <h4 class="text-sm font-serif font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">${evt.title}</h4>
        <p class="text-[10px] text-gray-500 uppercase tracking-widest">${evt.year} • ${evt.category}</p>
      </div>
      <div class="w-2 h-2 rounded-full" style="background-color: ${evt.color}"></div>
    `;
    div.addEventListener('click', () => {
      openPanel(evt);
      if (window.innerWidth < 768) {
        closePersonalPanelFn();
      }
    });
    return div;
  }

  function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    historyList.innerHTML = '';
    if(historyCache.length === 0) {
      historyList.innerHTML = '<p class="text-sm text-gray-400 text-center mt-10">Belum ada riwayat.</p>';
      return;
    }
    historyCache.forEach(id => {
      const evt = eventsData.find(e => e.id === id);
      if(evt) historyList.appendChild(createListItem(evt));
    });
  }
  
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      historyCache = [];
      localStorage.removeItem('eventHistory');
      renderHistory();
      showToast('Riwayat berhasil dihapus', 'success');
    });
  }

  function renderBookmarks() {
    contentBookmarks.innerHTML = '';
    if(bookmarkCache.length === 0) {
      contentBookmarks.innerHTML = '<p class="text-sm text-gray-400 text-center mt-10">Belum ada arsip yang disimpan.</p>';
      return;
    }
    bookmarkCache.forEach(id => {
      const evt = eventsData.find(e => e.id === id);
      if(evt) contentBookmarks.appendChild(createListItem(evt));
    });
  }

  // --- 8. MASTER LIBRARY (Map-Lock & Quick View) ---
  window.isMapLocked = false;
  const mapLockToggle = document.getElementById('mapLockToggle');
  if(mapLockToggle) {
    mapLockToggle.addEventListener('change', (e) => {
      window.isMapLocked = e.target.checked;
    });
  }

  const librarySearch = document.getElementById('librarySearch');
  const libraryYearFilter = document.getElementById('libraryYearFilter');
  const libraryCategoryFilter = document.getElementById('libraryCategoryFilter');
  const libraryList = document.getElementById('libraryList');
  
  // Populate Year Filter Dynamically
  if (libraryYearFilter) {
    const uniqueYears = [...new Set(eventsData.map(e => e.year))].sort((a, b) => b - a);
    uniqueYears.forEach(year => {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      libraryYearFilter.appendChild(opt);
    });
  }
  
  function renderLibrary() {
    libraryList.innerHTML = '';
    const query = librarySearch ? librarySearch.value.toLowerCase() : '';
    const year = libraryYearFilter ? libraryYearFilter.value : '';
    const category = libraryCategoryFilter ? libraryCategoryFilter.value : '';

    const filtered = eventsData.filter(e => {
      const matchQuery = e.title.toLowerCase().includes(query);
      const matchYear = year ? e.year === year : true;
      const matchCat = category ? e.category === category : true;
      return matchQuery && matchYear && matchCat;
    });

    if(filtered.length === 0) {
      libraryList.innerHTML = '<p class="text-sm text-gray-400 text-center mt-4">Tidak ada data.</p>';
      return;
    }
    filtered.forEach(evt => {
      libraryList.appendChild(createListItem(evt));
    });
  }

  if(librarySearch) {
    librarySearch.addEventListener('input', () => renderLibrary());
  }
  if(libraryYearFilter) {
    libraryYearFilter.addEventListener('change', () => renderLibrary());
  }
  if(libraryCategoryFilter) {
    libraryCategoryFilter.addEventListener('change', () => renderLibrary());
  }

  // --- SEARCH SUGGESTIONS (Floating bar) ---
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const searchClearBtn = document.getElementById('searchClearBtn');

  function highlightMatch(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded px-0.5">$1</mark>');
  }

  function showSuggestions(query) {
    if (!query.trim()) {
      searchSuggestions.classList.add('hidden');
      return;
    }
    const q = query.toLowerCase();
    const matches = eventsData.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.year.includes(q) ||
      e.category.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      searchSuggestions.innerHTML = `<div class="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Tidak ada peristiwa ditemukan.</div>`;
      searchSuggestions.classList.remove('hidden');
      return;
    }

    searchSuggestions.innerHTML = matches.map(evt => `
      <button class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors suggestion-item border-b border-gray-100 dark:border-gray-800 last:border-0" data-id="${evt.id}">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${evt.color}"></span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${highlightMatch(evt.title, query)}</p>
          <p class="text-xs text-gray-400">${evt.year} · ${evt.category.charAt(0).toUpperCase()+evt.category.slice(1)}</p>
        </div>
        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </button>
    `).join('');

    searchSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const evt = eventsData.find(e => e.id === btn.dataset.id);
        if (evt) {
          openPanel(evt);
          searchInput.value = evt.title;
          searchSuggestions.classList.add('hidden');
        }
      });
    });

    searchSuggestions.classList.remove('hidden');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      searchClearBtn.classList.toggle('hidden', !val);
      showSuggestions(val);
    });
    searchInput.addEventListener('focus', (e) => {
      if (e.target.value) showSuggestions(e.target.value);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchSuggestions.classList.add('hidden');
        searchInput.blur();
      }
    });
    document.addEventListener('click', (e) => {
      if (!searchInput.closest('.relative').contains(e.target)) {
        searchSuggestions.classList.add('hidden');
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchSuggestions.classList.add('hidden');
      searchClearBtn.classList.add('hidden');
      searchInput.focus();
    });
  }

  // --- 9. MODALS (Feedback & Contribution) ---

  // Feedback — bind both desktop and mobile buttons
  const feedbackModal = document.getElementById('feedbackModal');
  const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
  const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

  function openFeedbackModalFn() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('opacity-0', 'pointer-events-none');
    const inner = feedbackModal.querySelector('div');
    if (inner) inner.classList.remove('scale-95');
  }
  function closeFeedbackModalFn() {
    if (!feedbackModal) return;
    feedbackModal.classList.add('opacity-0', 'pointer-events-none');
    const inner = feedbackModal.querySelector('div');
    if (inner) inner.classList.add('scale-95');
  }

  ['feedbackBtn', 'mobileFeedbackBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openFeedbackModalFn);
  });
  if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeFeedbackModalFn);
  if (submitFeedbackBtn) submitFeedbackBtn.addEventListener('click', closeFeedbackModalFn);

  // Contextual Contribution
  const contributeBtn = document.getElementById('contributeBtn');
  const contributeModal = document.getElementById('contributeModal');
  const closeContributeBtn = document.getElementById('closeContributeBtn');
  const submitContributeBtn = document.getElementById('submitContributeBtn');
  
  const contributeFormState = document.getElementById('contributeFormState');
  const contributeSuccessState = document.getElementById('contributeSuccessState');
  const ticketIdDisplay = document.getElementById('ticketIdDisplay');

  if(contributeBtn && contributeModal) {
    contributeBtn.addEventListener('click', () => {
      contributeFormState.classList.remove('hidden');
      contributeFormState.classList.add('flex');
      contributeSuccessState.classList.add('hidden');
      contributeSuccessState.classList.remove('flex');
      
      document.getElementById('contribName').value = '';
      document.getElementById('contribStory').value = '';

      contributeModal.classList.remove('opacity-0', 'pointer-events-none');
      contributeModal.querySelector('.bg-white, .bg-gray-900').classList.remove('scale-95');
    });

    closeContributeBtn.addEventListener('click', () => {
      contributeModal.classList.add('opacity-0', 'pointer-events-none');
      contributeModal.querySelector('.bg-white, .bg-gray-900').classList.add('scale-95');
    });

    submitContributeBtn.addEventListener('click', () => {
      const name = document.getElementById('contribName').value || 'Anonim';
      const story = document.getElementById('contribStory').value;
      const ticketId = 'TK-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
      
      ticketIdDisplay.textContent = ticketId;
      
      // Store in mockup queue for Admin
      if(!window.adminQueue) window.adminQueue = [];
      window.adminQueue.push({
        id: ticketId,
        eventId: activeTabId,
        name: name,
        story: story,
        loc: eventsData.find(e => e.id === activeTabId).loc // rough mock loc
      });
      
      // Switch to success
      contributeFormState.classList.add('hidden');
      contributeFormState.classList.remove('flex');
      contributeSuccessState.classList.remove('hidden');
      contributeSuccessState.classList.add('flex');
    });
  }

  // --- 10. ADMIN DASHBOARD (Split-Screen) ---
  const adminBtn = document.getElementById('adminBtn');
  const adminDashboard = document.getElementById('adminDashboard');
  const closeAdminBtn = document.getElementById('closeAdminBtn');
  
  let adminMapInstance = null;
  let adminMarker = null;

  if(adminBtn) {
    adminBtn.addEventListener('click', () => {
      adminDashboard.classList.remove('translate-y-full');
      
      // Init Map if not yet
      if(!adminMapInstance) {
        adminMapInstance = L.map('adminMap', { zoomControl: false }).setView(jemberCenter, 11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(adminMapInstance);
      }
      setTimeout(() => adminMapInstance.invalidateSize(), 500);
      
      loadAdminQueue();
    });
    
    closeAdminBtn.addEventListener('click', () => {
      adminDashboard.classList.add('translate-y-full');
    });
  }

  function loadAdminQueue() {
    const adminDoneMessage = document.getElementById('adminDoneMessage');
    const targetEvent = document.getElementById('adminTargetEvent');
    const ticketId = document.getElementById('adminTicketId');
    const senderName = document.getElementById('adminSenderName');
    const senderStory = document.getElementById('adminSenderStory');
    const approveBtn = document.getElementById('adminApproveBtn');
    const rejectBtn = document.getElementById('adminRejectBtn');
    const adminContentWrapper = document.getElementById('adminContentWrapper');
    const adminQueueBadge = document.getElementById('adminQueueBadge');

    const queueLen = (window.adminQueue || []).length;
    if(adminQueueBadge) adminQueueBadge.textContent = `${queueLen} Antrean`;
    
    if(queueLen === 0) {
      adminDoneMessage.classList.remove('hidden');
      adminDoneMessage.classList.add('flex');
      adminContentWrapper.classList.add('hidden');
      
      if(adminMarker && adminMapInstance) adminMapInstance.removeLayer(adminMarker);
      return;
    }

    // Show first in queue
    const currentQueue = window.adminQueue[0];
    const evt = eventsData.find(e => e.id === currentQueue.eventId);
    if(!evt) {
      window.adminQueue.shift();
      loadAdminQueue();
      return;
    }
    
    adminDoneMessage.classList.add('hidden');
    adminDoneMessage.classList.remove('flex');
    adminContentWrapper.classList.remove('hidden');
    
    targetEvent.textContent = evt.title;
    ticketId.textContent = currentQueue.id;
    senderName.textContent = currentQueue.name;
    senderStory.textContent = `"${currentQueue.story}"`;

    // Map logic
    if(adminMarker && adminMapInstance) adminMapInstance.removeLayer(adminMarker);
    const mockOffset = [currentQueue.loc[0] + 0.01, currentQueue.loc[1] + 0.01];
    
    const icon = L.divIcon({ html: '<div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', className: 'custom-div-icon' });
    adminMarker = L.marker(mockOffset, {icon}).addTo(adminMapInstance);
    adminMapInstance.flyTo(mockOffset, 14);

    // Event listeners for Approve/Reject
    approveBtn.onclick = () => {
      if(!window.approvedAdminContributions) window.approvedAdminContributions = {};
      if(!window.approvedAdminContributions[currentQueue.eventId]) window.approvedAdminContributions[currentQueue.eventId] = [];
      
      window.approvedAdminContributions[currentQueue.eventId].push({
        name: currentQueue.name,
        story: currentQueue.story,
        ticket: currentQueue.id
      });
      
      window.adminQueue.shift();
      loadAdminQueue();
      
      if(activeTabId === currentQueue.eventId) {
        switchTab(activeTabId);
      }
    };
    
    rejectBtn.onclick = () => {
      window.adminQueue.shift();
      loadAdminQueue();
    };
  }

  // ===================================
  // MOBILE BOTTOM NAV & SHEET CONTROLS (inside fetch chain)
  // ===================================

  // Mobile counter HUD
  const mobileCounterEl = document.getElementById('mobileEventsCounter');
  if (mobileCounterEl) mobileCounterEl.textContent = eventsData.length;

  // Mobile Search Button — focus search bar
  const mobileSearchBtnEl = document.getElementById('mobileSearchBtn');
  if (mobileSearchBtnEl) {
    mobileSearchBtnEl.addEventListener('click', () => {
      const si = document.getElementById('searchInput');
      if (si) {
        si.focus();
        si.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Mobile Legend Sheet
  const mobileLegendBtnEl = document.getElementById('mobileLegendBtn');
  const mobileLegendSheetEl = document.getElementById('mobileLegendSheet');
  const closeLegendSheetBtnEl = document.getElementById('closeLegendSheetBtn');

  function openLegendSheet() {
    if (!mobileLegendSheetEl) return;
    mobileLegendSheetEl.classList.remove('translate-y-full');
    overlay.classList.add('active');
    overlay.onclick = () => { closeLegendSheet(); };
  }
  function closeLegendSheet() {
    if (!mobileLegendSheetEl) return;
    mobileLegendSheetEl.classList.add('translate-y-full');
    overlay.classList.remove('active');
  }

  if (mobileLegendBtnEl) mobileLegendBtnEl.addEventListener('click', openLegendSheet);
  if (closeLegendSheetBtnEl) closeLegendSheetBtnEl.addEventListener('click', closeLegendSheet);

  // Mobile Theme Toggle


  // Swipe-to-expand / dismiss for Event Panel
  const eventPanelSwipe = document.getElementById('eventPanel');
  const mobilePanelHandleEl = document.getElementById('mobilePanelHandle');
  let swipeTouchStartY = 0;
  let swipeTouchCurrentY = 0;
  let isSwipeDragging = false;
  let initialPanelHeight = 0;

  if (eventPanelSwipe && mobilePanelHandleEl) {
    mobilePanelHandleEl.addEventListener('touchstart', (e) => {
      swipeTouchStartY = e.touches[0].clientY;
      isSwipeDragging = true;
      initialPanelHeight = eventPanelSwipe.getBoundingClientRect().height;
      eventPanelSwipe.style.transition = 'none'; // Disable transition during drag
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!isSwipeDragging) return;
      swipeTouchCurrentY = e.touches[0].clientY;
      const deltaY = swipeTouchCurrentY - swipeTouchStartY;
      const newHeight = initialPanelHeight - deltaY;
      // Clamp between some reasonable min/max during drag
      const maxH = window.innerHeight * 0.9;
      const minH = window.innerHeight * 0.2;
      if (newHeight >= minH && newHeight <= maxH) {
        eventPanelSwipe.style.height = `${newHeight}px`;
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      if (!isSwipeDragging) return;
      isSwipeDragging = false;
      eventPanelSwipe.style.transition = 'height 0.3s ease, transform 0.6s ease';
      
      const delta = swipeTouchCurrentY - swipeTouchStartY;
      const vh50 = window.innerHeight * 0.5;
      
      if (delta > 60) {
        // Swiped down
        if (isMobilePanelExpanded) {
          isMobilePanelExpanded = false;
          eventPanelSwipe.style.height = '50vh';
          updateExpandIcon();
        } else {
          // Already collapsed, close it entirely
          const closePanelBtnEl = document.getElementById('closePanelBtn');
          if (closePanelBtnEl) closePanelBtnEl.click();
        }
      } else if (delta < -60) {
        // Swiped up
        if (!isMobilePanelExpanded) {
          isMobilePanelExpanded = true;
          eventPanelSwipe.style.height = '88vh';
          updateExpandIcon();
        } else {
          eventPanelSwipe.style.height = '88vh';
        }
      } else {
        // Snap back to current state
        eventPanelSwipe.style.height = isMobilePanelExpanded ? '88vh' : '50vh';
      }
      
      swipeTouchStartY = 0; swipeTouchCurrentY = 0;
    });
    
    // Also let clicking the handle toggle state
    mobilePanelHandleEl.addEventListener('click', () => {
       const expandBtn = document.getElementById('expandPanelBtn');
       if(expandBtn) expandBtn.click();
    });
  }
  
  function updateExpandIcon() {
    const expandBtn = document.getElementById('expandPanelBtn');
    if(!expandBtn) return;
    if (isMobilePanelExpanded) {
      expandBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5M4 10V6m0 0h4m-4 0l5 5m11-5v4m0-4h-4m4 0l-5 5"></path></svg>';
      expandBtn.title = "Perkecil Panel";
    } else {
      expandBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>';
      expandBtn.title = "Perbesar Panel";
    }
  }

  // --- 10. GLOBAL RESIZE HANDLER ---
  window.addEventListener('resize', () => {
    const ep = document.getElementById('eventPanel');
    if (!ep) return;
    if (window.innerWidth >= 768) {
      ep.style.height = ''; // Clear JS-enforced height to let CSS classes rule
      if (ep.classList.contains('translate-y-full')) {
        ep.classList.add('translate-x-full');
        ep.classList.remove('translate-y-full');
      }
    } else {
      if (ep.classList.contains('translate-x-full')) {
        ep.classList.add('translate-y-full');
        ep.classList.remove('translate-x-full');
      }
    }
  });

  function closePanel() {
    const ep = document.getElementById('eventPanel');
    if (ep) {
      ep.classList.add('translate-x-full'); // base
      if (window.innerWidth >= 768) {
        ep.classList.add('md:translate-x-full');
      } else {
        ep.classList.add('translate-y-full');
      }
    }
    
    // Hide panel content/footer explicitly when closed
    const pContent = document.getElementById('panelContent');
    const pEmptyState = document.getElementById('panelEmptyState');
    const pStickyFooter = document.getElementById('panelStickyFooter');
    
    if (pContent) pContent.classList.add('hidden');
    if (pStickyFooter) pStickyFooter.classList.add('hidden');
    if (pEmptyState) pEmptyState.classList.remove('hidden');
    
    if (activePolygon) {
      map.removeLayer(activePolygon);
      activePolygon = null;
    }
  }

  // Close event panel — also reset mobile sheet state
  const closePanelBtnFixed = document.getElementById('closePanelBtn');
  if (closePanelBtnFixed) {
    closePanelBtnFixed.addEventListener('click', () => {
      closePanel();
      setTimeout(() => map.invalidateSize(), 300);
    }, { once: false });
  }

}).catch(err => console.error('Failed to load events data:', err));

});

