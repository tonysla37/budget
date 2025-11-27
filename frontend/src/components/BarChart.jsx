import React, { useRef, useEffect } from 'react';

export default function BarChart({ data, width = 800, height = 300, showGrid = true }) {
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
    const allValues = data.flatMap(d => [d.income || 0, d.expenses || 0]);
    const maxValue = Math.max(...allValues, 0);

    // Fonction pour convertir valeur en hauteur
    const getHeight = (value) => {
      return (value / maxValue) * chartHeight;
    };

    // Largeur des barres
    const barWidth = chartWidth / data.length * 0.35;
    const groupWidth = chartWidth / data.length;

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
        const value = maxValue - (maxValue / 5) * i;
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
      }
    }

    // Dessiner l'axe X
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Dessiner les barres
    data.forEach((d, i) => {
      const x = padding.left + i * groupWidth;
      const centerX = x + groupWidth / 2;

      // Barre revenus (verte)
      if (d.income > 0) {
        const h = getHeight(d.income);
        const barX = centerX - barWidth - 2;
        const barY = height - padding.bottom - h;

        // Gradient vert
        const gradient = ctx.createLinearGradient(barX, barY, barX, barY + h);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth, h);

        // Bordure
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, h);
      }

      // Barre dépenses (rouge)
      if (d.expenses > 0) {
        const h = getHeight(d.expenses);
        const barX = centerX + 2;
        const barY = height - padding.bottom - h;

        // Gradient rouge
        const gradient = ctx.createLinearGradient(barX, barY, barX, barY + h);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#dc2626');

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth, h);

        // Bordure
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, h);
      }

      // Label X
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, centerX, height - padding.bottom + 20);
    });

  }, [data, width, height, showGrid]);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">Aucune donnée à afficher</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <canvas ref={canvasRef} className="mx-auto" />
      {/* Légende */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded"></div>
          <span className="text-sm text-gray-700">Revenus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-b from-red-500 to-red-600 rounded"></div>
          <span className="text-sm text-gray-700">Dépenses</span>
        </div>
      </div>
    </div>
  );
}
