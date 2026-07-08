import { Handle, Position } from "@xyflow/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { THEME_COLORS } from "./nodeThemes";
import { NodeHoverActions } from "./NodeHoverActions";


export function InputNode({ data, id }: any) {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const colors =
    activeTheme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <NodeHoverActions id={id}>
    <div className="flex flex-col items-center transition-colors duration-300">
      <div
        className={`relative rounded-md border ${colors.border} ${colors.bg}
        rounded-3xl px-4 py-3 text-sm shadow-sm flex items-center justify-center`}
      >
        {data.icon ? (
          <div className="relative w-8 h-8">
            <Image
              src={data.icon}
              alt={data.label}
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="text-xl">🔍</div>
        )}

        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            background: colors.handle,
            position: "absolute",
            top: "50%",
            right: "-6px",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
          }}
        />
      </div>

      <div
        className={`mt-1 text-xs ${colors.label} text-center max-w-[120px]`}
      >
        {data.label}
      </div>
    </div>
    </NodeHoverActions>
  );
}