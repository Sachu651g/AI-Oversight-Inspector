"""
benchmark_baseline.py — Compares random baseline vs trained overseer on OversightEnv.

Run this after training to produce a concrete before/after comparison.
Usage:
    python benchmark_baseline.py                     # random vs trained (local)
    python benchmark_baseline.py --episodes 20       # more episodes
    python benchmark_baseline.py --dry-run           # without loading model
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from oversight_env.env import OversightEnv
from oversight_env.models import OversightAction, ViolationType, SeverityLevel


# ---------------------------------------------------------------------------
# Random baseline agent
# ---------------------------------------------------------------------------

def random_action(obs) -> OversightAction:
    """Naive random agent — flip a coin, flag or approve."""
    if random.random() < 0.5 and obs.sub_agent_outputs:
        target = random.choice(obs.sub_agent_outputs)
        return OversightAction(
            action_type="flag_violation",
            target_agent_id=target.agent_id,
            violation_type=random.choice(list(ViolationType)).value,
            severity=random.choice(list(SeverityLevel)).value,
            explanation="Random flag for baseline comparison",
            confidence=random.random(),
        )
    return OversightAction(action_type="approve")


# ---------------------------------------------------------------------------
# Benchmark runner
# ---------------------------------------------------------------------------

def run_agent(agent_fn, n_episodes: int, difficulty: str, seed_offset: int = 0) -> dict:
    rewards, detections, fps, misses = [], [], [], []
    for ep in range(n_episodes):
        env = OversightEnv(task_id=difficulty, difficulty=difficulty, max_steps=15, seed=ep + seed_offset)
        obs = env.reset()
        ep_reward, done = 0.0, False
        ep_detections = ep_fps = ep_misses = 0
        while not done:
            action = agent_fn(obs)
            obs, reward, done, info = env.step(action)
            ep_reward += reward.total
            # Track from breakdown
            d = reward.breakdown
            if d.get("detection", 0) > 0:
                ep_detections += 1
            elif d.get("detection", 0) < 0:
                ep_fps += 1
            if d.get("missed_violation", 0) < 0:
                ep_misses += 1
        rewards.append(ep_reward)
        detections.append(ep_detections)
        fps.append(ep_fps)
        misses.append(ep_misses)

    n = n_episodes
    return {
        "avg_reward": round(sum(rewards) / n, 3),
        "min_reward": round(min(rewards), 3),
        "max_reward": round(max(rewards), 3),
        "avg_detections": round(sum(detections) / n, 2),
        "avg_false_positives": round(sum(fps) / n, 2),
        "avg_misses": round(sum(misses) / n, 2),
    }


def print_comparison(baseline: dict, trained: dict | None, difficulty: str) -> None:
    print(f"\n{'='*60}")
    print(f"  BENCHMARK: {difficulty.upper()} difficulty")
    print(f"{'='*60}")
    headers = ["Metric", "Random Baseline", "Trained Model", "Delta"]
    if trained is None:
        headers = ["Metric", "Random Baseline"]

    rows = [
        ("Avg episode reward", baseline["avg_reward"], trained["avg_reward"] if trained else None),
        ("Avg correct detections", baseline["avg_detections"], trained["avg_detections"] if trained else None),
        ("Avg false positives", baseline["avg_false_positives"], trained["avg_false_positives"] if trained else None),
        ("Avg missed violations", baseline["avg_misses"], trained["avg_misses"] if trained else None),
    ]

    col_w = [28, 18, 18, 12]
    print(f"{'Metric':<28} {'Baseline':>18} {'Trained':>18} {'Delta':>12}")
    print("-" * 78)
    for name, base_val, trained_val in rows:
        if trained_val is not None:
            delta = trained_val - base_val
            delta_str = f"{delta:+.3f}"
        else:
            delta_str = "—"
            trained_val = "—"
        print(f"{name:<28} {base_val:>18.3f} {str(trained_val):>18} {delta_str:>12}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Benchmark random vs trained overseer")
    parser.add_argument("--episodes", type=int, default=10, help="Episodes per difficulty")
    parser.add_argument("--dry-run", action="store_true", help="Only run random baseline")
    parser.add_argument("--model-path", type=str, default="./oversight_model", help="Path to trained model")
    parser.add_argument("--output-json", type=str, default=None, help="Save results to JSON")
    args = parser.parse_args()

    print("=" * 60)
    print("  AI Oversight Inspector — Benchmark Comparison")
    print("  Random Baseline vs Trained GRPO Model")
    print("=" * 60)

    results = {}

    for difficulty in ["easy", "medium", "hard"]:
        print(f"\nRunning random baseline ({args.episodes} episodes, {difficulty})...")
        baseline = run_agent(random_action, args.episodes, difficulty, seed_offset=0)

        trained = None
        if not args.dry_run and os.path.exists(args.model_path):
            print(f"Loading trained model from {args.model_path}...")
            try:
                from unsloth import FastLanguageModel
                model, tokenizer = FastLanguageModel.from_pretrained(
                    args.model_path, max_seq_length=2048, load_in_4bit=True
                )
                FastLanguageModel.for_inference(model)

                def trained_action(obs) -> OversightAction:
                    prompt = f"Review sub-agent outputs: {[o.model_dump() for o in obs.sub_agent_outputs]}"
                    inputs = tokenizer(prompt, return_tensors="pt")
                    out = model.generate(**inputs, max_new_tokens=150)
                    raw = tokenizer.decode(out[0], skip_special_tokens=True)
                    try:
                        import json as _json
                        data = _json.loads(raw.split("```")[-1] if "```" in raw else raw)
                        return OversightAction(**data)
                    except Exception:
                        return OversightAction(action_type="approve")

                trained = run_agent(trained_action, args.episodes, difficulty, seed_offset=1000)
            except Exception as e:
                print(f"  Could not load model: {e}. Running baseline only.")

        print_comparison(baseline, trained, difficulty)
        results[difficulty] = {"baseline": baseline, "trained": trained}

    if args.output_json:
        with open(args.output_json, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to {args.output_json}")

    print("\nTo run with a trained model:")
    print("  python benchmark_baseline.py --model-path ./oversight_model")
    print("\nTo run as dry-run (baseline only, no GPU needed):")
    print("  python benchmark_baseline.py --dry-run")


if __name__ == "__main__":
    main()
