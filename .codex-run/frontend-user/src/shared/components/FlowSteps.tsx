export function FlowSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <div key={step} className={`rounded-full px-3 py-1 text-xs font-bold ${index <= current ? "bg-[#7655aa] text-white" : "bg-[#eee9f7] text-[#766d86]"}`}>
          {index + 1}. {step}
        </div>
      ))}
    </div>
  );
}
