# Agents Guide for Wordle Helper

## Build & Test Commands
- **Development**: `npm start` (starts dev server)
- **Build**: `npm run build` (production build)
- **Test**: `npm test` (runs all tests)
- **Single test**: `npm test -- --testNamePattern="TestName"` or `npm test -- src/path/to/test.tsx`

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, use proper types
- **Imports**: React imports first, then external libraries, then local imports
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **Components**: Function components with default exports
- **Files**: `.tsx` for React components, `.ts` for utilities/types
- **CSS**: Tailwind CSS for styling (configured), className prop for styling
- **Arrays**: Use const assertions for readonly arrays (e.g., `export const words = [...]`)
- **Code organization**: Keep utility files (like words.ts) for data exports

## Project Structure
- React 19 + TypeScript + Tailwind CSS
- Create React App base with Jest testing framework
- ESLint with react-app configuration
- Main app entry: `src/App.tsx`

## 30-Minute MVP Strategy (COMPLETED)
- **Phase 1**: Basic filtering UI with 3 input sections (known positions, included letters, excluded letters) ✅
- **Phase 2**: Implement word filtering logic using existing words.ts ✅
- **Phase 3**: Style with Tailwind, add real-time updates ✅
- **MVP Components**: FilterInput, WordDisplay, App container ✅
- **Current Status**: Functional Wordle helper with real-time constraint-based filtering
- **Future Enhancements**: Drag-and-drop UI, probability scoring, multiple word lengths