import { memo, useEffect, useState } from 'react';
import { HexColorPicker, HexColorInput } from "react-colorful";

function preloadImages(images) {
  let prms = [];
  for (const e of images) {
    let i = new Image();
    i.src = e;
    prms.push(i.decode());
  }
  return Promise.all(prms);
}

function bypassCORS(url) {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

async function fetchColorAPI(color, target, limit) {
  let page = 1, imgs = [];
  while (imgs.length < target && page < limit) {
    const p = await fetch(
      bypassCORS(`https://www.designspiration.com/resource/content/?page=color-saves&url=/color/${color}/&page_number=${page}&show_promoted=false`)
    ).then(r => r.json());
    for (const e of p.data) {
      imgs.push({thumb: e.images["1x"].url, link: e.images["4x"].url, id: e.id});
    }
    page++;
  }
  return imgs;
}

async function fetchColorAPIOld(color, target, limit) {
  const p = await fetch(bypassCORS(`https://www.designspiration.com/color/${color}/`)).then(r => r.text());
  const dom = new DOMParser().parseFromString(p, 'text/html');
  const lst = dom.getElementsByClassName("gridItems")[0].getElementsByClassName("gridItemContent");
  return Array.from(lst).map((e, i) => {return {thumb: e.src, link: e.src, id: i}});
}

function Grid({ imgs }) {
  return (
    <div className="flex flex-row justify-center items-center flex-wrap overflow-x-clip">
      { imgs.map(e => (
        <div className="m-2 hover:scale-150 transition-all" key={e.id}>
          <a href={e.link} target="_blank" rel="noreferrer">
            <img src={e.thumb} className="rounded-lg h-60"></img>
          </a>
        </div>
      )) }
    </div>
  );
}

const MemoisedGrid = memo(Grid);

function ConditionalAppear({ visible, children }) {
  return (
    <div className={"transition-all duration-300" + (visible ? "" : " opacity-0")}>
      {children}
    </div>
  )
}

export default function App() {
  const fetch = 20, limit = 5, preload = 10;
  const [color, setColor] = useState("#aabbcc");
  const [imgs, setImgs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const body = document.body;
    const root = document.getElementById("root");
    body.className = "font-arial text-xl bg-slate-800";
    body.style = "color-scheme: only light;";
    root.className = "flex flex-col items-center justify-center min-h-screen";
    root.style = "margin-left: calc(100vw - 100%); margin-right: 0;";
    return () => {
      [body, root].map((e) => {
        e.removeAttribute("class");
        e.removeAttribute("style");
      });
    };
  }, []);

  async function fetchImgs() {
    setLoading(true);
    let res = await fetchColorAPI(color.substring(1), fetch, limit);
    await preloadImages(res.slice(0, preload).map(e => e.thumb));
    setImgs(res);
    setLoading(false);
  }

  return (
    <>
    <span className="text-6xl md:text-8xl text-white m-5">WallPicker</span>
    <div className="flex flex-row justify-center items-center m-10">
      <HexColorPicker color={color} onChange={setColor} className="m-6" />
      <div className="flex flex-col justify-center items-center">
        <HexColorInput color={color} onChange={setColor} className="rounded uppercase text-black text-center w-32 m-3 px-4 py-2" />
        <button onClick={fetchImgs} className="bg-lime-400 outline-1 rounded text-grey w-32 m-3 px-4 py-2">{ "Search" + (loading ? "ing..." : "") }</button>
      </div>
    </div>
    <ConditionalAppear visible={!loading}>
      <MemoisedGrid imgs={imgs} />
    </ConditionalAppear>
    </>
  );
}
