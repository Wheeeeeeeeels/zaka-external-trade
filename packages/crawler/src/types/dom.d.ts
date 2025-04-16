declare global {
  interface Document {
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeListOf<Element>;
  }

  interface Element {
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeListOf<Element>;
    getAttribute(name: string): string | null;
    textContent: string | null;
  }

  interface HTMLElement extends Element {
    textContent: string | null;
  }

  interface Location {
    href: string;
    pathname: string;
  }

  interface Window {
    document: Document;
    location: Location;
  }
} 