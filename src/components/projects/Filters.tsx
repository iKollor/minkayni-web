import { useMemo, useState, type FC } from "react";
import FilterToggleButton from "./FilterToggleButton";

export interface FilterOption {
    id: string;
    label: string;
}

export interface FilterGroup {
    id: string;
    label: string;
    multiple?: boolean;
    allowParentSelect?: boolean;
    options: FilterOption[];
}

interface FiltersProps {
    groups: FilterGroup[];
    initialActiveGroupId?: string;
    onChange?: (groupId: string, ids: string[]) => void;
    className?: string;
    text?: string;
    activeText?: string;
}

const Filters: FC<FiltersProps> = ({ groups, initialActiveGroupId, onChange, className = "", text = "Filtros", activeText = "Ocultar filtros" }) => {
    const [open, setOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState(initialActiveGroupId ?? groups[0]?.id ?? "");
    const [selected, setSelected] = useState<Record<string, string[]>>({});
    const activeGroup = useMemo(() => groups.find((group) => group.id === activeGroupId) ?? groups[0], [activeGroupId, groups]);

    const toggleOption = (group: FilterGroup, optionId: string) => {
        const current = selected[group.id] ?? [];
        const next = group.multiple
            ? current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId]
            : current.includes(optionId)
              ? []
              : [optionId];
        setSelected((value) => ({ ...value, [group.id]: next }));
        onChange?.(group.id, next);
    };

    return (
        <div className={className}>
            <FilterToggleButton active={open} text={text} activeText={activeText} onClick={() => setOpen((value) => !value)} />
            {open && activeGroup ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-3 border-b border-gray-200 pb-3" role="tablist" aria-label="Grupos de filtros">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                type="button"
                                role="tab"
                                aria-selected={activeGroupId === group.id}
                                className={`text-sm font-medium px-1 py-1 cursor-pointer ${activeGroupId === group.id ? "text-gray-900 font-semibold" : "text-gray-700 hover:text-gray-900"}`}
                                onClick={() => setActiveGroupId(group.id)}
                            >
                                {group.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeGroup.options.map((option) => {
                            const checked = (selected[activeGroup.id] ?? []).includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    aria-pressed={checked}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-black ${checked ? "border-gray-900 bg-gray-100" : "bg-white border-gray-300 hover:bg-gray-50"}`}
                                    onClick={() => toggleOption(activeGroup, option.id)}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Filters;
