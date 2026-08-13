export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p className="footer-credit">
        © {year} <strong>Dr. Sourav Bhadwal</strong> and <strong>Dr. Akash Tiwari</strong>
      </p>
      <p className="footer-credit">
        Designed &amp; developed by <strong>Gaurav Kumar</strong>
      </p>
      <p className="footer-license">
        Released under the{" "}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT License
        </a>
      </p>
    </footer>
  );
}
