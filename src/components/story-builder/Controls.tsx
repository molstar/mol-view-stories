"use client";

import React from "react";
import { useAtom } from "jotai";
import { ScenesAtom, ActiveSceneIdAtom, SetActiveSceneAtom } from "@/app/appstate";
import { ExportButton } from "@/components/story-builder/ExportButton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function Controls() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);

  const activeScene = scenes.find(scene => scene.id === activeSceneId);

  const handleSceneChange = (value: string) => {
    const sceneId = parseInt(value, 10);
    setActiveScene(sceneId);
  };

  return (
    <div className="space-y-3">
      {/* Command Bar */}
      <div className="bg-muted/50 border border-border rounded-lg p-2">
        <div className="flex justify-between items-center">
          <Menubar className="bg-transparent border-0 shadow-none h-8">
            <MenubarMenu>
              <MenubarTrigger className="text-sm">File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New Story <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Open Story <MenubarShortcut>⌘O</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Save <MenubarShortcut>⌘S</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Export PDF <MenubarShortcut>⌘E</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            
            <Separator orientation="vertical" className="h-6" />
            
            <MenubarMenu>
              <MenubarTrigger className="text-sm">Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Cut <MenubarShortcut>⌘X</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Copy <MenubarShortcut>⌘C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Paste <MenubarShortcut>⌘V</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            
            <Separator orientation="vertical" className="h-6" />
            
            <MenubarMenu>
              <MenubarTrigger className="text-sm">Scene</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Add New Scene <MenubarShortcut>⌘⇧N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Duplicate Scene <MenubarShortcut>⌘D</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Delete Scene <MenubarShortcut>⌘⌫</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Move Up <MenubarShortcut>⌘↑</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Move Down <MenubarShortcut>⌘↓</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            
            <Separator orientation="vertical" className="h-6" />
            
            <MenubarMenu>
              <MenubarTrigger className="text-sm">View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Toggle Preview <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Full Screen <MenubarShortcut>⌘⌃F</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Reset Zoom <MenubarShortcut>⌘0</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Scenes:</span>
            <Select value={activeSceneId.toString()} onValueChange={handleSceneChange}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Select a scene">
                  {activeScene?.header || "Select a scene"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id.toString()}>
                    {scene.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton />
          </div>
        </div>
      </div>


    </div>
  );
