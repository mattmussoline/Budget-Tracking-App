alter table public.provider_color_overrides
drop constraint if exists provider_color_overrides_color_key_check;

alter table public.provider_color_overrides
add constraint provider_color_overrides_color_key_check
check (
  color_key in (
    'blue',
    'emerald',
    'amber',
    'rose',
    'violet',
    'cyan',
    'lime',
    'teal',
    'sky',
    'indigo',
    'fuchsia',
    'pink',
    'orange',
    'yellow',
    'green',
    'red',
    'purple',
    'slate',
    'zinc',
    'stone',
    'neutral',
    'gray'
  )
);
