export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hand icon representing "Mão na Massa" */}
      <g>
        {/* Hand silhouette */}
        <path
          d="M8 28c0-1.5 1-3 2.5-3.5C11 24 12 23 12 21.5c0-1 .5-2 1.5-2.5C14 18.5 15 17.5 15 16c0-1 .5-2 1.5-2.5C17 13 18 12 18 10.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5c0 .5.5 1 1 1s1-.5 1-1c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5v18c0 2-1.5 3.5-3.5 3.5h-15C8.5 31.5 8 30 8 28z"
          fill="currentColor"
          className="text-blue-600"
        />
        {/* Thumb */}
        <path d="M18 18c0-1 1-2 2-2s2 1 2 2v4c0 1-1 2-2 2s-2-1-2-2v-4z" fill="currentColor" className="text-blue-500" />
        {/* Tool/wrench accent */}
        <path
          d="M25 12l3-3c.5-.5 1.5-.5 2 0s.5 1.5 0 2l-3 3c-.5.5-1.5.5-2 0s-.5-1.5 0-2z"
          fill="currentColor"
          className="text-orange-500"
        />
      </g>

      {/* Text "Mão na Massa" */}
      <g className="text-gray-800">
        <text x="38" y="16" fontSize="12" fontWeight="700" fill="currentColor">
          Mão na
        </text>
        <text x="38" y="28" fontSize="12" fontWeight="700" fill="currentColor" className="text-blue-600">
          Massa
        </text>
      </g>
    </svg>
  )
}
