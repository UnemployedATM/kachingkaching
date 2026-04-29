import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

/**
 * Shows a step-by-step prerequisite notice when a section can't be used yet.
 *
 * steps: Array of { label, to?, linkText?, onClick? }
 *   - to        → renders a <Link> to that route
 *   - onClick   → renders a <button> (for switching tabs on the same page)
 *   - linkText  → label for the link/button (defaults to "Go →")
 */
export default function SetupNotice({ steps }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 p-4">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {steps.length === 1 ? "Complete this step first:" : "Complete these steps first:"}
          </p>
          <ol className="space-y-1.5 list-none">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                <span className="shrink-0 w-4 font-semibold">{i + 1}.</span>
                <span>
                  {step.label}
                  {step.to && (
                    <Link
                      to={step.to}
                      className="ml-1.5 font-medium underline underline-offset-2 hover:text-amber-600 transition-colors"
                    >
                      {step.linkText || "Go →"}
                    </Link>
                  )}
                  {step.onClick && (
                    <button
                      type="button"
                      onClick={step.onClick}
                      className="ml-1.5 font-medium underline underline-offset-2 hover:text-amber-600 transition-colors"
                    >
                      {step.linkText || "Do it →"}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
