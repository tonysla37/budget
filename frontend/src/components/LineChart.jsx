import React, { useRef, useEffect } from 'react';

export default function LineChart({ data, width = 800, height = 300, color = '#3b82f6', showGrid = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Ajuster pour le retina display
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Marges
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Trouver min et max
    const values = data.map(d => d.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Fonction pour convertir valeur en coordonnée Y
    const getY = (value) => {
      return padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
    };

    // Fonction pour convertir index en coordonnée X
    const getX = (index) => {
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    // Dessiner la grille
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Lignes horizontales
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Labels Y
        const value = maxValue - (range / 5) * i;
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
      }

      // Lignes verticales
      data.forEach((d, i) => {
        const x = getX(i);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
      });
    }

    // Dessiner les labels X
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = getX(i);
      ctx.fillText(d.label, x, height - padding.bottom + 20);
    });

    // Dessiner la zone sous la courbe (gradient)
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding.bottom);
    data.forEach((d, i) => {
      ctx.lineTo(getX(i), getY(d.value));
    });
    ctx.lineTo(getX(data.length - 1), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Dessiner la ligne
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Dessiner les points
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      
      // Point blanc avec bordure
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [data, width, height, color, showGrid]);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">Aucune donnée à afficher</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
}
