"use client";

import React from "react";
import { MonacoEditor } from "./components/MonacoEditor.jsx";
import Image from "next/image";
import { useAtom } from "jotai";
import { SceneAtom, StateAtom, initializeMolstarAtom } from "./appstate.ts";
import { MolStar } from "./components/MolStar.jsx";

function SceneList() {
  const [scenes] = useAtom(StateAtom);
  console.log(scenes);
  return (
    <div>
      <h2>Scene List</h2>
      <ul>
        {scenes.map((scene) => (
          <li key={scene.id}>
            <h3>{scene.markdown}</h3>
            <h4>{scene.javascript}</h4>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex w-full gap-4">
          <div className="flex-1">
            <h1>Hello</h1>
          </div>
          <div className="flex-[2]">
            <SceneList></SceneList>
            <MolStar></MolStar>
          </div>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
