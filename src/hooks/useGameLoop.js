import { useState, useEffect, useCallback, useRef } from "react";
import {
  freshState, gameTick, buyBuilding, startProject, doPrestige, startResearch,
  deriveState, saveGame, loadGame, TICK_MS,
} from "../engine/GameEngine.js";

const AUTO_SAVE_INTERVAL = 30_000; // auto-save every 30s

export function useGameLoop() {
  const [state, setState] = useState(() => {
    const saved = loadGame();
    return saved || freshState(0);
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Core game tick
  useEffect(() => {
    const iv = setInterval(() => {
      setState((s) => gameTick(s));
    }, TICK_MS);
    return () => clearInterval(iv);
  }, []);

  // Auto-save
  useEffect(() => {
    const iv = setInterval(() => {
      saveGame(stateRef.current);
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(iv);
  }, []);

  // Actions
  const buy = useCallback((id) => {
    setState((s) => buyBuilding(s, id));
  }, []);

  const start = useCallback((projId) => {
    setState((s) => startProject(s, projId));
  }, []);

  const prestige = useCallback(() => {
    setState((s) => doPrestige(s));
  }, []);

  const research = useCallback((trackId) => {
    setState((s) => startResearch(s, trackId));
  }, []);

  const spend = useCallback((amount) => {
    setState((s) => s.funds >= amount ? { ...s, funds: s.funds - amount } : s);
  }, []);

  const addLog = useCallback((msg) => {
    setState((s) => ({ ...s, log: [...s.log.slice(-60), { msg, t: Date.now() }] }));
  }, []);

  const save = useCallback(() => {
    saveGame(stateRef.current);
  }, []);

  const reset = useCallback(() => {
    const fresh = freshState(0);
    setState(fresh);
    saveGame(fresh);
  }, []);

  // Derived (recomputed each render — cheap)
  const derived = deriveState(state);

  return { state, derived, buy, start, prestige, research, spend, addLog, save, reset };
}
