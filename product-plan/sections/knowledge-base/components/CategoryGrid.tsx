'use client'

import type { CategoryGridProps } from '../types'
import { CategoryCard } from './CategoryCard'

export function CategoryGrid({ categories, onCategoryClick }: CategoryGridProps) {
  return (
    <div>
      <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
        Browse by Category
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </div>
  )
}
