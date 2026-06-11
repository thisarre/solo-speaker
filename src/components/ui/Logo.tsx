export function Logo() {
  return (
    <div className="flex items-center gap-2.5 text-sm font-semibold tracking-[0]">
      <span className="relative size-[18px] rounded-md bg-ink after:absolute after:left-[5px] after:top-[5px] after:size-2 after:rounded-full after:bg-accent" />
      <span>Solo Speaker</span>
    </div>
  );
}
