/**
 * Farm nav icon — matches Studio `PageTheeIcon` (Farms sidebar).
 * Uses currentColor so active/hover styles apply.
 */
export function FarmNavIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="22"
      viewBox="0 0 34 34"
      width="22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        clipRule="evenodd"
        d="M6.77344 5.64453C5.80694 5.64453 5.02344 6.42803 5.02344 7.39453V26.6057C5.02344 27.5722 5.80694 28.3557 6.77344 28.3557H27.2271C28.1936 28.3557 28.9771 27.5722 28.9771 26.6057V7.39453C28.9771 6.42803 28.1936 5.64453 27.2271 5.64453H6.77344ZM6.52344 7.39453C6.52344 7.25646 6.63537 7.14453 6.77344 7.14453H11.7197L11.7197 16.1982L6.52344 16.1982V7.39453ZM6.52344 17.6982V26.6057C6.52344 26.7437 6.63537 26.8557 6.77344 26.8557H20.7939L20.7939 17.6982L6.52344 17.6982ZM22.2939 17.6982V26.8557H27.2271C27.3651 26.8557 27.4771 26.7437 27.4771 26.6057V17.6982H22.2939ZM27.4771 16.1982V7.39453C27.4771 7.25646 27.3651 7.14453 27.2271 7.14453H13.2197L13.2197 16.1982L27.4771 16.1982Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}
