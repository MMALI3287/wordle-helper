# 🎯 Wordle Helper

**An intelligent, high-performance Wordle solving assistant powered by information theory and optimized algorithms.**

![Wordle Helper Demo](design_draft.svg)

## ✨ Features

### 🧠 **Intelligent Word Analysis**

- **Information Theory Engine**: Real-time entropy calculations to find optimal word choices using Web Workers
- **Pre-computed Starting Words**: Research-backed optimal first guesses (SOARE, SLATE, TRACE for 5‑letter words)
- **Smart Constraint Logic**: Advanced filtering system that understands green, yellow, and gray letter constraints
- **Multi-length Support**: Full support for 3-12 letter words with 29,000+ word database

### ⚡ **Blazing Fast Performance**

- **Sub-second Loading**: Word lists load in 40-70ms with intelligent caching
- **Web Worker Processing**: Non-blocking entropy calculations in background threads
- **Real-time Filtering**: Instant word filtering as you add constraints
- **Ultra-fast Builds**: Powered by Rsbuild (0.1-0.2s rebuild times)
- **Optimized Algorithms**: Bit manipulation and efficient data structures

### 🎨 **Intuitive Drag & Drop Interface**

- **Visual Letter Management**: Drag letters from alphabet to categorize them
- **Color-coded Sections**:
  - 🟩 **Green**: Correct letters in right positions
  - 🟨 **Yellow**: Letters in word but wrong positions (with position exclusions)
  - ⬛ **Gray**: Letters not in the word
- **Smart Position Tracking**: Yellow letters remember which positions they're NOT in
- **One-click Removal**: Click any placed letter to remove it
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🔬 **Advanced Analysis Features**

- **Entropy Rankings**: Words ranked by information gain (bits of information)
- **Dynamic Calculations**: Real-time optimal word suggestions based on current constraints
- **Smart Mode Switching**: Automatically shows starting words vs. entropy calculations
- **Constraint Persistence**: Maintains letter constraints when changing word lengths
- **Progress Indicators**: Visual feedback during background processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with Web Workers support

### Installation

```bash
# Clone the repository
git clone https://github.com/MMALI3287/wordle-helper.git
cd wordle-helper

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the URL printed by the dev server in your terminal (for example, `http://localhost:3000` or `http://localhost:3001`).

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## 🎮 How to Use

### 1. **Choose Word Length**

- Select from 3-12 letters using the dropdown (default: 5 letters)
- App loads appropriate word database (15K-30K words depending on length)

### 2. **Get Starting Word Suggestions**

- When no constraints are set, see pre-computed optimal starting words
- Each word shows entropy score and research-backed description
- Starting words optimized for each word length

### 3. **Add Constraints by Dragging Letters**

#### 🟩 **Green Letters (Correct Positions)**

- Drag letters to numbered position slots
- Letters turn green with "×" button to remove
- Right-click to convert to yellow letter

#### 🟨 **Yellow Letters (Wrong Positions)**

- Drag letters to position slots under "Yellow" section
- Specify which positions the letter is NOT in
- Letters show exclusion positions (e.g., "≠2" means not in position 2)
- Can exclude multiple positions for same letter

#### ⬛ **Gray Letters (Not in Word)**

- Drag letters to gray area to mark as not in word
- Eliminates all words containing these letters

### 4. **Get Optimal Suggestions**

- Once constraints are added, app calculates entropy for all words
- Results show words ranked by information gain
- Higher bits = better choice for narrowing possibilities
- Calculations happen in background Web Worker (non-blocking)

### 5. **Monitor Progress**

- See filtered word count update in real-time
- Progress indicators during entropy calculations
- Victory celebration when down to 1 word!

## 🏗️ Technical Architecture

### Core Technologies

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build Tool**: Rsbuild (next-generation bundler, 50x faster than Webpack)
- **Background Processing**: Web Workers for entropy calculations
- **State Management**: React hooks with optimized re-rendering
- **Drag & Drop**: React DnD with HTML5 backend

### Performance Optimizations

- **Web Worker Architecture**: All heavy computations moved to background threads
- **Smart Caching**: Multi-layer word list caching for instant access
- **Efficient Algorithms**: Bit manipulation for pattern matching
- **Memory Management**: Optimized data structures and garbage collection
- **Bundle Optimization**: Tree shaking, code splitting, and compression

### Algorithm Details

- **Information Theory**: Uses entropy calculations H = -Σ(p_i \* log2(p_i))
- **Pattern Matching**: Efficient constraint checking with early termination
- **Word Filtering**: Optimized algorithms for real-time results
- **Constraint Logic**: Advanced yellow letter position exclusion tracking

## 📁 Project Structure

```
wordle-helper/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── entropyWorker.ts        # Web Worker interface
│   ├── bestStartingWords.ts    # Pre-computed starting words
│   └── App.css                 # Application styles
├── public/
│   ├── entropyWorker.js        # Web Worker implementation
│   └── words_*.json            # Word lists by length (3-12 letters)
├── build/                      # Production build output
└── .coderabbit.yaml           # AI code review configuration
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript compiler checks

### Key Features for Developers

- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense
- **ESLint & Prettier**: Consistent code formatting
- **Web Worker Support**: Easy background processing setup
- **Modern React**: Hooks, functional components, React 19 features

## 🔬 Performance Metrics

Based on real testing with 29,874 six-letter words:

- **Word Loading**: 40-70ms for 15K-30K words
- **Real-time Filtering**: <10ms for constraint application
- **Entropy Calculation**: 500-3200ms for full analysis (background)
- **UI Responsiveness**: <16ms for 60fps interactions
- **Memory Usage**: Efficient with large word datasets
- **Build Time**: 0.4s initial / 0.1-0.2s rebuilds

## 🧪 Algorithm Research

### Starting Word Recommendations

- **5-letter**: SOARE (5.89 bits), SLATE (~5.84 bits), TRACE (~5.81 bits)
- Notes: values are approximate and depend on the exact word list used by the app.
- **Research Sources**: 3Blue1Brown, Tyler Glaiel analysis, MIT researchers
- **Methodology**: Information theory + letter frequency analysis

### Entropy Calculation Accuracy

- Uses proper information theory formulas
- Accounts for all possible response patterns
- Optimized for speed without sacrificing accuracy

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Information Theory**: Based on research in optimal Wordle strategies
- **Starting Words**: Curated from MIT analysis, 3Blue1Brown, and NYT Wordlebot research
- **Performance**: Inspired by modern web development and Web Worker best practices
- **UI/UX**: Influenced by modern design principles and accessibility standards

## 📊 Word Database

- **3-letter words**: 1,000+ words
- **4-letter words**: 5,000+ words
- **5-letter words**: 15,918 words (standard Wordle size)
- **6-letter words**: 29,874 words
- **7-12 letter words**: Extensive collections for word puzzles
- **Sources**: Curated from multiple dictionaries and word lists

---

**Made with ❤️ for Wordle enthusiasts and puzzle solvers**

_Transform your Wordle strategy with the power of information theory!_
