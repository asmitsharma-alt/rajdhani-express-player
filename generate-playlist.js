import fs from 'fs';

const lines = fs.readFileSync("C:\\Users\\admin\\Downloads\\Indian Bus Driver's Playlist.txt", 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0);

const songs = [];

async function search(query) {
  try {
    const res = await fetch(`https://jiosaavn-api-ten-beryl.vercel.app/api/search/songs?query=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.success && json.data && json.data.results && json.data.results.length > 0) {
      // Filter out weird covers if possible, but just taking the first result is usually fine for popular songs
      const s = json.data.results[0];
      const url = s.downloadUrl?.[s.downloadUrl.length - 1]?.url || '';
      if (!url) return null;
      return {
        title: s.name,
        artist: s.artists?.primary?.map(a => a.name).join(', ') || 'Unknown',
        cover: s.image?.[s.image.length - 1]?.url || '',
        url: url
      };
    }
  } catch (e) {
    console.error(e.message);
  }
  return null;
}

async function main() {
  for (let i = 0; i < Math.min(lines.length, 78); i++) {
    const line = lines[i];
    const parts = line.split(' - ');
    const artistPart = parts[0];
    let titlePart = parts[1] || line;
    // strip "(From ...)" to improve search
    titlePart = titlePart.replace(/\(From.*\)/i, '').trim();
    
    console.log(`[${i+1}/${lines.length}] Searching: ${titlePart}`);
    
    let song = await search(titlePart + " " + artistPart.split(',')[0]); 
    if (!song) {
      song = await search(titlePart); // fallback
    }
    
    if (song) {
      song.title = titlePart;
      song.artist = artistPart;
      songs.push(song);
    } else {
      console.log(` ---> Failed to find: ${line}`);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Make sure the requested song from earlier is still first
  const firstSong = {
    title: 'Mujhse Mohabbat Ka Izhar',
    artist: 'Kumar Sanu & Alka Yagnik',
    url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/73/8d/15/738d156d-9e7c-ca85-d3b7-9127e7073eed/mzaf_11068079046950985898.plus.aac.p.m4a',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/04/51/79/0451791d-9be5-85b1-601e-835f45efc6af/8901854010080.jpg/500x500bb.jpg'
  };
  
  // If the first song was found in the list, remove the duplicate
  const filtered = songs.filter(s => !s.title.toLowerCase().includes('mujhse mohabbat'));
  
  const finalSongs = [firstSong, ...filtered];
  
  const content = `export const SONGS = ${JSON.stringify(finalSongs, null, 2)};`;
  fs.writeFileSync('src/playlist.ts', content);
  console.log("Wrote src/playlist.ts with " + finalSongs.length + " songs!");
}

main();
