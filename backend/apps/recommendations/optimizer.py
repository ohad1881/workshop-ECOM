from ortools.algorithms.python import knapsack_solver

from .constants import STRATEGY_BALANCED, STRATEGY_MAX_ITEMS, STRATEGY_MAX_SCORE


def optimize_gift_bundle(scored_products, budget, strategy=STRATEGY_BALANCED):
    """
    0/1 Knapsack: select products that maximise total value within budget.

    Args:
        scored_products: list of { 'product': Product, 'score': float, 'explanation': str }
        budget: Decimal or float
        strategy: 'max_score' | 'max_items' | 'balanced'

    Returns:
        list of selected product dicts (same structure as input items)
    """
    if not scored_products or budget <= 0:
        return []

    budget_cents = int(float(budget) * 100)

    SCORE_SCALE = 1000
    ITEM_BONUS = 300  # raised: all candidates already pass MIN_RELEVANCE_THRESHOLD

    if strategy == STRATEGY_MAX_SCORE:
        values = [int(p['score'] * SCORE_SCALE) for p in scored_products]
    elif strategy == STRATEGY_MAX_ITEMS:
        values = [100 for _ in scored_products]
    else:  # balanced (default)
        values = [
            int(p['score'] * (SCORE_SCALE - ITEM_BONUS) + ITEM_BONUS)
            for p in scored_products
        ]

    weights = [max(int(float(p['product'].price) * 100), 1) for p in scored_products]

    solver = knapsack_solver.KnapsackSolver(
        knapsack_solver.SolverType.KNAPSACK_MULTIDIMENSION_BRANCH_AND_BOUND_SOLVER,
        'GiftOptimizer',
    )
    solver.init(values, [weights], [budget_cents])
    solver.solve()

    return [
        scored_products[i]
        for i in range(len(scored_products))
        if solver.best_solution_contains(i)
    ]
