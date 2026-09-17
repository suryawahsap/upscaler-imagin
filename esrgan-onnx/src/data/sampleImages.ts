export interface SampleImage {
  id: string;
  name: string;
  category: string;
  description: string;
  width: number;
  height: number;
  url: string;
}

// Function to generate crisp low-resolution sample canvases as data URLs
function generateSampleCanvas(type: 'anime' | 'portrait' | 'pixel' | 'landscape'): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'anime') {
    // 240x240 anime girl character avatar with noise & compression artifacts
    canvas.width = 240;
    canvas.height = 240;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 240, 240);
    grad.addColorStop(0, '#fbcfe8');
    grad.addColorStop(1, '#c084fc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 240);

    // Face base
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(120, 130, 60, 0, Math.PI * 2);
    ctx.fill();

    // Hair back
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.arc(120, 110, 75, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(95, 125, 12, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(145, 125, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(98, 120, 5, 0, Math.PI * 2);
    ctx.arc(148, 120, 5, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.ellipse(85, 140, 10, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(155, 140, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(120, 142, 14, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Hair bangs
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(120, 115);
    ctx.lineTo(170, 70);
    ctx.lineTo(120, 45);
    ctx.closePath();
    ctx.fill();

    // Add mild compression/pixel grain
    const imgData = ctx.getImageData(0, 0, 240, 240);
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (Math.random() > 0.85) {
        const noise = (Math.random() - 0.5) * 28;
        imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
        imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
        imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);

  } else if (type === 'portrait') {
    // 256x256 Vintage sepia portrait with sensor noise
    canvas.width = 256;
    canvas.height = 256;

    // Dark moody backdrop
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 150);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(1, '#1c1917');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Silhouette / portrait
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(128, 110, 52, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders
    ctx.beginPath();
    ctx.ellipse(128, 210, 85, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vintage details
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(110, 105, 6, 0, Math.PI * 2);
    ctx.arc(146, 105, 6, 0, Math.PI * 2);
    ctx.fill();

    // Noise layer
    const imgData = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 45;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + n));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

  } else if (type === 'pixel') {
    // 180x180 Game badge icon
    canvas.width = 180;
    canvas.height = 180;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 180, 180);

    // Shield/crest
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(90, 20);
    ctx.lineTo(150, 45);
    ctx.lineTo(140, 125);
    ctx.lineTo(90, 160);
    ctx.lineTo(40, 125);
    ctx.lineTo(30, 45);
    ctx.closePath();
    ctx.fill();

    // Inner gold star
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(90, 90, 32, 0, Math.PI * 2);
    ctx.fill();

    // Lettering
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRO', 90, 97);

  } else {
    // 280x200 Landscape scenery
    canvas.width = 280;
    canvas.height = 200;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(1, '#fed7aa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 280, 120);

    // Sun
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(200, 55, 26, 0, Math.PI * 2);
    ctx.fill();

    // Mountains
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(20, 120);
    ctx.lineTo(90, 40);
    ctx.lineTo(160, 120);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.lineTo(190, 50);
    ctx.lineTo(260, 120);
    ctx.closePath();
    ctx.fill();

    // Lake
    const lake = ctx.createLinearGradient(0, 120, 0, 200);
    lake.addColorStop(0, '#0284c7');
    lake.addColorStop(1, '#0f172a');
    ctx.fillStyle = lake;
    ctx.fillRect(0, 120, 280, 80);
  }

  return canvas.toDataURL('image/png');
}

export function getSampleImages(): SampleImage[] {
  return [
    {
      id: 'sample_anime',
      name: 'avatar_anime_lowres.png',
      category: 'Anime / Ilustrasi',
      description: 'Gaya anime 240x240 dengan garis halus & artefak kompresi',
      width: 240,
      height: 240,
      url: generateSampleCanvas('anime'),
    },
    {
      id: 'sample_portrait',
      name: 'potret_vintage_noisy.png',
      category: 'Foto / Potret',
      description: 'Foto vintage sepia dengan noise grain sensor fotografi',
      width: 256,
      height: 256,
      url: generateSampleCanvas('portrait'),
    },
    {
      id: 'sample_pixel',
      name: 'badge_logo_pixel.png',
      category: 'Ikon & Vektor',
      description: 'Lencana digital 180x180 dengan tepi kontras tinggi',
      width: 180,
      height: 180,
      url: generateSampleCanvas('pixel'),
    },
    {
      id: 'sample_landscape',
      name: 'pemandangan_alam.png',
      category: 'Pemandangan',
      description: 'Citra pemandangan alam dengan gradasi langit & pegunungan',
      width: 280,
      height: 200,
      url: generateSampleCanvas('landscape'),
    },
  ];
}
