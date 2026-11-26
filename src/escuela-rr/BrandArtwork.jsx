const BrandArtwork = ({ alternate = false }) => (
  <svg viewBox="0 0 38 38" width="100%" height="100%" aria-hidden="true">
    <rect width="38" height="38" rx="12" fill={alternate ? '#344987' : '#5969d8'} />
    {alternate ? (
      <>
        <path d="M7 25h24M11 20h16M15 15h8" stroke="#bcebd7" strokeWidth="4" />
        <path d="M9 29h5v5H9zm15-8h5v5h-5zM17 7h5v5h-5z" fill="#ffd88b" />
      </>
    ) : (
      <>
        <path d="M9 13h20M9 19h20M9 25h20" stroke="#fff" strokeOpacity=".35" strokeWidth="3" />
        <circle cx="14" cy="13" r="3.2" fill="#ffc9d3" />
        <circle cx="24" cy="19" r="3.2" fill="#b9f0d6" />
        <circle cx="17" cy="25" r="3.2" fill="#ffe0b8" />
      </>
    )}
  </svg>
);

export default BrandArtwork;
