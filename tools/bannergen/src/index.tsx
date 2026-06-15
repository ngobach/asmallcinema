import satori from 'satori';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import Banner from './Banner';

async function generate() {
  console.log('Fetching online font assets (Instrument Sans)...');
  const [fontRegular, fontBold] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSTF-Tfykyk.ttf')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch Regular font: ${res.status} ${res.statusText}`);
        return res.arrayBuffer();
      }),
    fetch('https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQi_jfykyk.ttf')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch Bold font: ${res.status} ${res.statusText}`);
        return res.arrayBuffer();
      })
  ]);

  console.log('Rendering banner elements to SVG...');
  const svg = await satori(
    <Banner />,
    {
      width: 800,
      height: 350,
      fonts: [
        {
          name: 'Instrument Sans',
          data: fontRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Instrument Sans',
          data: fontBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  const outputPath = path.resolve(import.meta.dirname, '../../../resources/banner.svg');
  await fs.writeFile(outputPath, svg, 'utf-8');
  console.log(`Successfully generated SVG banner at ${outputPath}`);
}

generate().catch(err => {
  console.error('Error generating banner:', err);
  process.exit(1);
});
