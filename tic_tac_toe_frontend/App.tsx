import React, { useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Ocean Professional Theme
 * - Modern, clean, subtle gradients, rounded corners
 * - Primary blue, amber secondary
 */
const colors = {
  primary: '#2563EB', // blue
  secondary: '#F59E0B', // amber
  success: '#F59E0B',
  error: '#EF4444',
  gradientFrom: 'rgba(59,130,246,0.08)', // blue-500/10
  gradientTo: '#f9fafb', // gray-50
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  shadow: 'rgba(17,24,39,0.1)',
};

type CellValue = 'X' | 'O' | null;

type GameState = {
  board: CellValue[];
  current: 'X' | 'O';
  winner: 'X' | 'O' | 'Draw' | null;
  moves: number;
};

const initialState: GameState = {
  board: Array(9).fill(null),
  current: 'X',
  winner: null,
  moves: 0,
};

// PUBLIC_INTERFACE
function App(): JSX.Element {
  /**
   * Main Tic Tac Toe app implementing local two-player gameplay.
   * - Shows player indicators
   * - Displays a 3x3 board with touch input
   * - Announces result (win/draw)
   * - Reset/Restart functionality
   * Returns a React element to be used as the entry point.
   */
  const [state, setState] = useState<GameState>(initialState);

  // Simple subtle background pulse animation to add visual depth
  const bgAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [bgAnim]);

  const bgInterpolate = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.gradientTo, colors.gradientFrom],
  });

  const winningLine = useMemo(() => {
    if (!state.winner || state.winner === 'Draw') return null;
    return getWinningLine(state.board);
  }, [state.board, state.winner]);

  const handlePressCell = (index: number) => () => {
    setState((prev) => {
      if (prev.winner) return prev; // ignore taps after game ends
      if (prev.board[index] !== null) return prev; // already occupied

      const board = [...prev.board];
      board[index] = prev.current;

      const winner = calculateWinner(board);
      const moves = prev.moves + 1;

      return {
        board,
        current: winner ? prev.current : prev.current === 'X' ? 'O' : 'X',
        winner: winner ?? (moves === 9 ? 'Draw' : null),
        moves,
      };
    });
  };

  const handleReset = () => {
    // Smooth reset animation cue could be added here
    setState(initialState);
  };

  const indicatorText = useMemo(() => {
    if (state.winner === 'Draw') return "It's a draw!";
    if (state.winner === 'X') return 'Player X wins!';
    if (state.winner === 'O') return 'Player O wins!';
    return `Player ${state.current}'s turn`;
  }, [state.current, state.winner]);

  const indicatorColor = useMemo(() => {
    if (state.winner === 'Draw') return colors.text;
    if (state.winner) return colors.primary;
    return state.current === 'X' ? colors.primary : colors.secondary;
  }, [state.current, state.winner]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: bgInterpolate as unknown as string,
          },
        ]}
      >
        <View style={styles.card}>
          <Text style={[styles.title]}>Tic Tac Toe</Text>

          {/* Player Indicator */}
          <View style={styles.indicatorRow}>
            <PlayerPill
              label="Player ♘"
              active={!state.winner && state.current === 'X'}
              color={colors.primary}
            />
            <Text style={[styles.indicatorText, { color: indicatorColor }]} accessibilityRole="header">
              {indicatorText
                .replace('Player X', 'Player ♘')
                .replace('Player O', 'Player ♛')}
            </Text>
            <PlayerPill
              label="Player ♛"
              active={!state.winner && state.current === 'O'}
              color={colors.secondary}
            />
          </View>

          {/* Board */}
          <Board
            board={state.board}
            onPressCell={handlePressCell}
            winningLine={winningLine}
            disabled={!!state.winner}
          />

          {/* Reset */}
          <View style={styles.controls}>
            <Button
              label={state.moves === 0 ? 'Start' : state.winner ? 'Play Again' : 'Reset'}
              onPress={handleReset}
              variant={state.winner ? 'primary' : 'ghost'}
            />
          </View>
        </View>

        <Text style={styles.footer}>Ocean Professional • Clean. Minimal. Elegant.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

/**
 * PlayerPill
 * Small rounded indicator with active accent
 */
function PlayerPill({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <View
      style={[
        styles.pill,
        {
          borderColor: active ? color : colors.border,
          backgroundColor: active ? `${color}14` : colors.surface,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}${active ? ' (active)' : ''}`}
    >
      <View
        style={[
          styles.pillDot,
          {
            backgroundColor: color,
            opacity: active ? 1 : 0.35,
          },
        ]}
      />
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

/**
 * Board
 * 3x3 grid with subtle separation lines, animated press feedback, and win highlight
 */
function Board({
  board,
  onPressCell,
  winningLine,
  disabled,
}: {
  board: CellValue[];
  onPressCell: (index: number) => (e: GestureResponderEvent) => void;
  winningLine: number[] | null;
  disabled: boolean;
}) {
  return (
    <View style={styles.boardWrapper} accessibilityRole="none">
      <View style={styles.board}>
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <Cell
              key={idx}
              value={cell}
              onPress={onPressCell(idx)}
              highlight={!!isWinningCell}
              disabled={disabled || cell !== null}
            />
          );
        })}
        {/* Grid Lines */}
        <View style={[styles.line, styles.lineVertical, { left: '33.333%' }]} />
        <View style={[styles.line, styles.lineVertical, { left: '66.666%' }]} />
        <View style={[styles.line, styles.lineHorizontal, { top: '33.333%' }]} />
        <View style={[styles.line, styles.lineHorizontal, { top: '66.666%' }]} />
      </View>
    </View>
  );
}

/**
 * Cell
 * Single board cell with press animation and value display
 */
function Cell({
  value,
  onPress,
  highlight,
  disabled,
}: {
  value: CellValue;
  onPress: (e: GestureResponderEvent) => void;
  highlight: boolean;
  disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const contentColor = value === 'X' ? colors.primary : colors.secondary;
  const displayedIcon = value === 'X' ? '♘' : value === 'O' ? '♛' : '';

  return (
    <Animated.View style={[styles.cell, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.cellInner,
          {
            backgroundColor: pressed && !disabled ? '#F3F4F6' : 'transparent',
            borderColor: highlight ? contentColor : 'transparent',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          value
            ? `Cell ${value === 'X' ? 'knight' : 'queen'}`
            : 'Cell empty'
        }
      >
        {value && (
          <Text
            style={[
              styles.cellText,
              {
                color: contentColor,
                textShadowColor: highlight ? `${contentColor}55` : 'transparent',
              },
              highlight ? styles.cellTextHighlight : undefined,
            ]}
          >
            {displayedIcon}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Button
 * Minimal rounded button with variants
 */
function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : colors.surface,
          borderColor: isPrimary ? colors.primary : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.buttonText, { color: isPrimary ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Calculate the winner of a Tic Tac Toe board or return null if no winner yet.
 */
function calculateWinner(squares: CellValue[]): 'X' | 'O' | null {
  const lines = WIN_LINES;
  for (let i = 0; i < lines.length; i += 1) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

/**
 * Get indexes making up the winning line for highlighting
 */
function getWinningLine(squares: CellValue[]): number[] | null {
  for (let i = 0; i < WIN_LINES.length; i += 1) {
    const [a, b, c] = WIN_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return [a, b, c];
    }
  }
  return null;
}

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default App;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  indicatorRow: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  boardWrapper: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  board: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    padding: 6,
  },
  line: {
    position: 'absolute',
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  lineVertical: {
    top: '4%',
    bottom: '4%',
    width: 1,
  },
  lineHorizontal: {
    left: '4%',
    right: '4%',
    height: 1,
  },
  cell: {
    width: '33.333%',
    height: '33.333%',
    padding: 4,
    position: 'absolute',
  },
  cellInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowRadius: 8,
  },
  cellTextHighlight: {
    textShadowOffset: { width: 0, height: 2 },
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  button: {
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 12,
  },
});

/**
 * Absolute positions for the 3x3 grid cells.
 * We position them to ensure the grid lines sit on top for a clean minimalist look.
 */
(function ensureCellPositions() {
  // This IIFE isn't executed; its presence is a hint for future devs.
})();

// To visually place each cell in the 3x3 grid using absolute positions,
// we rely on index-based translation applied in render via styles.
// For clarity and performance, we'll generate a set of styles once:
const cellPositions = [
  { left: '0%', top: '0%' },
  { left: '33.333%', top: '0%' },
  { left: '66.666%', top: '0%' },
  { left: '0%', top: '33.333%' },
  { left: '33.333%', top: '33.333%' },
  { left: '66.666%', top: '33.333%' },
  { left: '0%', top: '66.666%' },
  { left: '33.333%', top: '66.666%' },
  { left: '66.666%', top: '66.666%' },
];

// Patch Pressable cell to use absolute positions by overriding render function of Cell
// We redefine Cell here to inject positions. This is a compact approach for this single-file app.
/* eslint-disable @typescript-eslint/no-unused-vars */
function _patchCellPositions() {
  // no-op placeholder. The actual position styles are injected via a wrapper below.
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Wrap the original Cell render to include absolute position styles.
// To keep the code minimal and in a single file, we redeclare a lightweight renderer:
const OriginalCell = Cell;
// Define explicit prop type to avoid 'any'
type OriginalCellProps = React.ComponentProps<typeof OriginalCell>;
type PositionedCellProps = OriginalCellProps & { index?: number };

// @ts-expect-error deliberate shadowing for specialization
Cell = function PositionedCell(props: PositionedCellProps) {
  // Extract index safely with default
  const index = props.index ?? 0;
  // Inject absolute position via wrapper View
  return (
    <View style={[{ position: 'absolute' }, cellPositions[index]]}>
      <OriginalCell {...props} />
    </View>
  );
} as unknown as typeof OriginalCell;

// Redefine Board to pass index through to Cell for positioning
/* Redefine Board without aliasing to avoid unused variable lint error */
// @ts-expect-error deliberate shadowing for specialization
Board = function PositionedBoard(props: React.ComponentProps<typeof Board>) {
  const { board, onPressCell, winningLine, disabled } = props;
  return (
    <View style={styles.boardWrapper} accessibilityRole="none">
      <View style={styles.board}>
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <Cell
              key={idx}
              // @ts-expect-error pass-through
              index={idx}
              value={cell}
              onPress={onPressCell(idx)}
              highlight={!!isWinningCell}
              disabled={disabled || cell !== null}
            />
          );
        })}
        <View style={[styles.line, styles.lineVertical, { left: '33.333%' }]} />
        <View style={[styles.line, styles.lineVertical, { left: '66.666%' }]} />
        <View style={[styles.line, styles.lineHorizontal, { top: '33.333%' }]} />
        <View style={[styles.line, styles.lineHorizontal, { top: '66.666%' }]} />
      </View>
    </View>
  );
} as unknown as typeof OriginalBoard;
