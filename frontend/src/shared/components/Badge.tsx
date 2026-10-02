import React from 'react';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose';
  projectStatus?: ProjectStatus;
  taskStatus?: TaskStatus;
  taskPriority?: TaskPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  projectStatus,
  taskStatus,
  taskPriority,
  size = 'sm',
  className = '',
}) => {
  let computedVariant = variant || 'slate';
  let label = children;

  if (projectStatus) {
    switch (projectStatus) {
      case 'ACTIVE':
        computedVariant = 'emerald';
        label = label || 'Активен';
        break;
      case 'COMPLETED':
        computedVariant = 'blue';
        label = label || 'Завершён';
        break;
      case 'ARCHIVED':
        computedVariant = 'slate';
        label = label || 'В архиве';
        break;
    }
  } else if (taskStatus) {
    switch (taskStatus) {
      case 'TODO':
        computedVariant = 'amber';
        label = label || 'К выполнению';
        break;
      case 'IN_PROGRESS':
        computedVariant = 'indigo';
        label = label || 'В работе';
        break;
      case 'COMPLETED':
        computedVariant = 'emerald';
        label = label || 'Выполнено';
        break;
    }
  } else if (taskPriority) {
    switch (taskPriority) {
      case 'LOW':
        computedVariant = 'slate';
        label = label || 'Низкий';
        break;
      case 'MEDIUM':
        computedVariant = 'amber';
        label = label || 'Средний';
        break;
      case 'HIGH':
        computedVariant = 'rose';
        label = label || 'Высокий';
        break;
    }
  }

  const variantStyles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[computedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {label}
    </span>
  );
};
