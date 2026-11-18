import { useState } from "react";

const LICENSE_TEXT = `MIT License

Copyright (c) 2026 Dr. Sourav Bhadwal and Dr. Akash Tiwari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function Footer() {
  const year = new Date().getFullYear();
  const [showLicense, setShowLicense] = useState(false);

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
        <button
          type="button"
          className="footer-license-btn"
          onClick={() => setShowLicense(true)}
        >
          MIT License
        </button>
      </p>

      {showLicense && (
        <div
          className="license-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="MIT License"
          onClick={() => setShowLicense(false)}
        >
          <div className="license-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="license-close"
              aria-label="Close"
              onClick={() => setShowLicense(false)}
            >
              ✕
            </button>
            <pre className="license-text">{LICENSE_TEXT}</pre>
          </div>
        </div>
      )}
    </footer>
  );
}
