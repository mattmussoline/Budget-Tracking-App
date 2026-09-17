export function TitleCaps({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => {
        if (!word) return i < words.length - 1 ? " " : null;
        return (
          <span key={i}>
            <span className="text-[1.15em]">{word[0]?.toUpperCase()}</span>
            <span className="text-[0.82em] tracking-[.02em]">{word.slice(1).toUpperCase()}</span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}
