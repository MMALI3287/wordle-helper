# Wordle Helper Website - Complete Project Specification

## Project Overview

Build an interactive web application that helps users solve Wordle puzzles by providing intelligent word suggestions based on constraint-based filtering. The application uses a drag-and-drop interface to categorize letters and displays real-time filtered word lists ranked by probability.

## Core Functionality Requirements

### 1. Word Length Configuration

- **Initial Setup**: Present a dropdown or input field allowing users to select word length (default: 5 letters, range: 3-8 letters)
- **Dynamic Adaptation**: All interface elements (letter slots, word suggestions) adjust based on selected word length
- **Word Database**: Maintain separate word lists for each supported length, sourced from common dictionary APIs or word lists

### 2. Three-Box Letter Classification System

#### Box 1: Unknown Letters Pool

- **Initial State**: Contains all 26 alphabet letters as draggable cards
- **Behavior**: Letters remain in this box even when dragged elsewhere (acts as an infinite source)
- **Visual Design**: Styled like a Kanban board column with clear labeling "Available Letters"
- **Letter Cards**: Each letter displayed as a distinct, draggable card with hover effects

#### Box 2: Letters in Word (Yellow Letters)

- **Purpose**: Contains letters that exist in the target word but whose positions are unknown
- **Behavior**: Accepts multiple instances of the same letter
- **Constraint Logic**: These letters must appear in suggested words but not in positions specified in the position slots below
- **Visual Feedback**: Cards in this box should have a yellow-tinted background to match Wordle's color scheme

#### Box 3: Letters Not in Word (Gray Letters)

- **Purpose**: Contains letters confirmed to not exist in the target word
- **Constraint Logic**: Any word containing these letters is filtered out from suggestions
- **Visual Feedback**: Cards should have a gray background matching Wordle's excluded letter styling
- **Behavior**: Accepts multiple instances for user convenience

### 3. Position-Specific Letter Placement

#### Correct Position Slots

- **Layout**: Horizontal row of slots matching the selected word length
- **Functionality**: Each slot accepts exactly one letter card
- **Constraint Logic**: Letters placed here must appear in exactly that position in suggested words
- **Visual Design**: Slots should be clearly numbered and have a green highlight when filled
- **Interaction**: Users can drag letters directly from any box or remove letters back to the unknown pool

### 4. Real-Time Word Filtering Engine

#### Filtering Logic Implementation

The application applies multiple constraint layers simultaneously:

**Primary Constraints:**

- Word must match the exact length specified
- Must contain all letters from Box 2 (yellow letters)
- Must not contain any letters from Box 3 (gray letters)
- Must have correct letters in positions specified by the position slots

**Advanced Constraint Handling:**

- Letters in Box 2 cannot appear in positions where they've been explicitly placed in position slots
- Handle multiple instances of letters correctly (if 'E' appears twice in Box 2, the word must contain at least two E's)
- Position slots override Box 2 constraints for the same letter

#### Probability Ranking System

- **Frequency Analysis**: Rank words by letter frequency in common English usage
- **Position-Specific Probability**: Consider how common each letter is in each position
- **Word Popularity**: Weight by word frequency in modern English corpus
- **Dynamic Scoring**: Recalculate scores in real-time as constraints change

### 5. Word Suggestion Display

#### Results Interface

- **Live Updates**: Word list refreshes immediately after any drag-and-drop action
- **Ranking Display**: Show words in descending probability order
- **Probability Scores**: Display percentage or confidence score for each suggestion
- **Responsive Design**: Handle anywhere from 0 to 100+ suggestions gracefully
- **Word Highlighting**: Visually emphasize how each suggested word satisfies the current constraints

## Technical Implementation Specifications

### Recommended Technology Stack

- **Framework**: React with TypeScript for type safety and component reusability
- **Drag & Drop**: React DND library for smooth, accessible drag-and-drop interactions
- **Styling**: Tailwind CSS for rapid UI development and consistent design system
- **State Management**: React Context API or Zustand for managing complex constraint states
- **Word Data**: Static JSON files or integration with dictionary APIs

### Component Architecture

#### Core Components Structure

The application should be broken down into logical, reusable components:

**App Container**: Manages overall state and word length configuration
**LetterCard Component**: Reusable draggable letter representation
**DropZone Component**: Generic container for letter classification boxes
**PositionSlot Component**: Individual position-specific letter slots
**WordSuggestions Component**: Filtered and ranked word display
**ConstraintEngine**: Service class handling all filtering logic

#### State Management Strategy

The application needs to track multiple interconnected state elements:

**Current Constraints State**: Letters in each box, position-specific placements
**Word Database State**: Currently loaded word list based on selected length
**UI State**: Drag states, loading indicators, error handling
**Filter Results State**: Current filtered word list with probability scores

### User Experience Considerations

#### Accessibility Features

- **Screen Reader Support**: Proper ARIA labels for all interactive elements
- **Keyboard Navigation**: Full keyboard support for drag-and-drop alternatives
- **Color Blind Friendly**: Use patterns or icons in addition to color coding
- **Mobile Responsive**: Touch-friendly drag-and-drop for mobile devices

#### Performance Optimization

- **Efficient Filtering**: Implement debounced filtering to prevent excessive recalculations
- **Large Word Lists**: Use virtualization for displaying extensive word suggestions
- **Memory Management**: Efficiently handle multiple instances of letter cards

### Advanced Features for Enhanced Functionality

#### Smart Suggestions

- **Pattern Recognition**: Identify common word patterns and endings
- **Contextual Hints**: Suggest words based on common Wordle answer patterns
- **Difficulty Assessment**: Indicate how challenging each suggested word might be

#### User Experience Enhancements

- **Undo/Redo Functionality**: Allow users to quickly revert constraint changes
- **Save/Load Sessions**: Enable users to save their current puzzle state
- **Multiple Puzzle Support**: Allow working on multiple puzzles simultaneously

## Success Criteria

The completed application should enable users to:

- Set up constraints faster than manually checking words
- Receive mathematically sound word suggestions that significantly improve their Wordle solving success rate
- Interact with an intuitive interface that feels natural and responsive
- Access the tool on any device with consistent functionality

This specification provides a roadmap for building a sophisticated Wordle helper that combines intuitive user interaction with powerful constraint-based word filtering, ultimately helping users optimize their puzzle-solving strategy through intelligent word suggestion algorithms.
