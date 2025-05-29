import { ActiveSceneAtom, modifyCurrentScene } from "@/app/appstate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom, useStore } from "jotai";
import { useEffect, useState } from "react";

export function OptionsEditor() {
    const store = useStore();
    const [scene] = useAtom(ActiveSceneAtom);

    return (
        <div className="flex flex-col gap-2">
            <div>
                <Label htmlFor="scene-header">Header</Label>
                <StatefulInput
                    id="scene-header"
                    value={scene?.header || ""}
                    placeholder="Scene Title"
                    onChange={(value) => {
                        modifyCurrentScene(store, { header: value.trim() });
                    }} />
            </div>
            <div>
                <Label htmlFor="scene-key">Key</Label>
                <StatefulInput
                    id="scene-key"
                    value={scene?.key || ""}
                    placeholder="Scene Key"
                    onChange={(value) => {
                        modifyCurrentScene(store, { key: value.trim() ? value : undefined });
                    }} />
            </div>
            <div>
                <Label htmlFor="linger-duration">Linger Duration (ms)</Label>
                <StatefulInput
                    id="linger-duration"
                    value={`${scene?.linger_duration_ms ?? ""}`}
                    placeholder="Linger Duration in milliseconds"
                    onChange={(value) => {
                        if (!value.trim()) {
                            modifyCurrentScene(store, { linger_duration_ms: undefined });    
                        } else {
                            const numValue = parseInt(value, 10);
                            modifyCurrentScene(store, { linger_duration_ms: Number.isFinite(numValue) ? numValue : undefined });
                        }
                    }} />
            </div>
            <div>
                <Label htmlFor="transition-duration">Transition Duration (ms)</Label>
                <StatefulInput
                    id="transition-duration"
                    value={`${scene?.transition_duration_ms ?? ""}`}
                    placeholder="Transition Duration in milliseconds"
                    onChange={(value) => {
                        if (!value.trim()) {
                            modifyCurrentScene(store, { transition_duration_ms: undefined });    
                        } else {
                            const numValue = parseInt(value, 10);
                            modifyCurrentScene(store, { transition_duration_ms: Number.isFinite(numValue) ? numValue : undefined });
                        }
                    }} />
            </div>
        </div>
    );
}

function StatefulInput({ id, value, placeholder, onChange }: { id: string; value: string; placeholder: string; onChange: (value: string) => void }) {
    const [current, setCurrent] = useState(value);
    useEffect(() => {
        setCurrent(value);
    }, [value])
    return (
        <Input
            id={id}
            value={current}
            placeholder={placeholder}
            onChange={(e) => {
                setCurrent(e.target.value);
            }}
            onBlur={() => {
                onChange(current);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.currentTarget.blur();
                }
            }}
        />
    );
}