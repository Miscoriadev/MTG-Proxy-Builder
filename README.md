# MTG Proxy Builder

A web-based application for creating high-quality custom Magic: The Gathering proxy cards. Search for any MTG card, customize its appearance, and download print-ready images.

**[Try it live at mtgproxies.tabletop.cloud](https://mtgproxies.tabletop.cloud)**

![React](https://img.shields.io/badge/React-19.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Vite](https://img.shields.io/badge/Vite-7.x-646cff)
![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey)

## Features

- **Card Search** - Find any Magic card using Scryfall's autocomplete API
- **Custom Borders** - Choose from multiple border styles including classic frames and legendary variants
- **Background Art** - Select and position card artwork with intuitive drag-and-zoom controls
- **Automatic Color Detection** - Border colors automatically match the card's color identity
- **Print Quality Export** - Download cards at various DPI settings (up to 600+ DPI) for professional printing
- **Mana Symbol Rendering** - Accurate mana symbols rendered from Scryfall's SVG library
- **Dynamic Text Layout** - Proper text rendering for card names, type lines, oracle text, power/toughness, and flavor text

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Miscoriadev/MTG-Proxy-Builder.git
   cd mtg-proxy-builder
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Search for a Card** - Type a card name in the search box to find cards via Scryfall
2. **Select a Border** - Choose your preferred border style from the available options
3. **Choose Background Art** - Select from available art options for the card
4. **Adjust Positioning** - Drag to pan and scroll to zoom the background art
5. **Set DPI** - Choose your desired print quality (300 DPI recommended for printing)
6. **Download** - Click the download button to save your proxy card as a PNG

## Project Structure

```
mtg-proxy-builder/
├── src/
│   ├── components/       # React components
│   │   ├── CardBuilder/  # Main builder interface
│   │   ├── CardPreview/  # Canvas rendering and preview
│   │   └── Controls/     # UI controls (selectors, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services (Scryfall)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions (rendering, parsing)
├── public/
│   ├── data/             # JSON configuration files
│   ├── borders/          # Border image assets
│   ├── backgrounds/      # Background art assets
│   └── fonts/            # Custom fonts (Beleren, MPlantin)
└── ...
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas** - High-quality card rendering
- **Scryfall API** - Card data and search functionality

## Legal Disclaimer

This tool is intended for creating proxy cards for personal, non-commercial use only (e.g., playtesting, casual play, cube drafts).

Magic: The Gathering is a trademark of Wizards of the Coast LLC. This project is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC.

Please respect the intellectual property rights of Wizards of the Coast and card artists. Do not use this tool to create counterfeit cards or for any commercial purpose.

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

You are free to:

- **Share** - Copy and redistribute the material in any medium or format
- **Adapt** - Remix, transform, and build upon the material

Under the following terms:

- **Attribution** - You must give appropriate credit and indicate if changes were made
- **NonCommercial** - You may not use the material for commercial purposes

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Scryfall](https://scryfall.com/) for their excellent MTG API and mana symbol SVGs
- The Magic: The Gathering community for inspiration and feedback

## Contributing

Contributions are welcome for non-commercial improvements! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
