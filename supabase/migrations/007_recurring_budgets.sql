-- Presupuestos fijos (recurrentes): un límite por categoría, no por mes

alter table public.category_budgets drop constraint if exists category_budgets_year_month_check;

-- Conservar el registro más reciente por categoría y eliminar duplicados mensuales
with ranked as (
  select
    id,
    row_number() over (
      partition by couple_id, category_id, scope
      order by updated_at desc
    ) as rn
  from public.category_budgets
)
delete from public.category_budgets
where id in (select id from ranked where rn > 1);

update public.category_budgets
set year_month = 'recurring'
where year_month <> 'recurring';

alter table public.category_budgets
  add constraint category_budgets_year_month_check
  check (year_month = 'recurring');

create index if not exists category_budgets_couple_recurring_idx
  on public.category_budgets (couple_id)
  where year_month = 'recurring';
