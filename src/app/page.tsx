"use client";

import React from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneAtom,
  SetActiveSceneAtom,
  UpdateMvsDataAtom,
} from "./appstate";
import { MolStar } from "./components/MolStar.jsx";
import { MonacoEditorJotai } from "./components/MonacoEditor.jsx";

function SceneList() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeScene] = useAtom(ActiveSceneAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);
  const [, updateMvsData] = useAtom(UpdateMvsDataAtom);

  const handleSceneSelect = (sceneId: number) => {
    setActiveScene(sceneId);
    updateMvsData();
  };

  return (
    <div>
      <h2>Scene List</h2>
      <ul className="space-y-2">
        {scenes.map((scene) => (
          <li
            key={scene.id}
            className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
              activeScene?.id === scene.id
                ? "bg-blue-50 border-blue-300"
                : "border-gray-200"
            }`}
            onClick={() => handleSceneSelect(scene.id)}
          >
            <h3 className="font-semibold text-lg">{scene.header}</h3>
            <p className="text-sm text-gray-600 mt-1">{scene.description}</p>
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
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">StoriesCreator</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SceneList />
            </div>
            <div className="lg:col-span-2">
              <div className="app-container">
                <MonacoEditorJotai />
                <div className="visualization-container">
                  <MolStar />
                </div>
              </div>
            </div>
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
