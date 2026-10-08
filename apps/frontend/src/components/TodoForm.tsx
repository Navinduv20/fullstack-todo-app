import { Button, Field, Flex, Input, Stack, Text, Textarea, Theme } from '@chakra-ui/react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DESC_MAX,
  TITLE_MAX,
  todoInputSchema,
  type TodoInput,
  type TodoValues,
} from '@todo/shared';
import { strings } from '../utils/strings';

interface Props {
  defaultValues?: TodoValues;
  submitLabel: string;
  onSubmit: (values: TodoValues) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  panel?: boolean;
}

function Counter({ length, max }: { length: number; max: number }) {
  return (
    <Text textStyle="xs" color={length > max * 0.9 ? 'fg.error' : 'fg.muted'}>
      {length}/{max}
    </Text>
  );
}

export function TodoForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
  panel,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<TodoInput, unknown, TodoValues>({
    resolver: zodResolver(todoInputSchema),
    defaultValues: defaultValues ?? { title: '', description: '' },
    mode: 'onChange',
  });

  const [title, description] = useWatch({ control, name: ['title', 'description'] });

  const submit = handleSubmit((values) => {
    onSubmit(values);
    if (!defaultValues) reset();
  });

  const fields = (
    <Stack gap="5">
      <Field.Root invalid={!!errors.title}>
        <Flex w="full" justify="space-between" align="baseline">
          <Field.Label>{strings.form.titleLabel}</Field.Label>
          <Counter length={title.length} max={TITLE_MAX} />
        </Flex>
        <Input
          variant="flushed"
          placeholder={strings.form.titlePlaceholder}
          autoFocus={autoFocus}
          {...register('title')}
        />
        <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root invalid={!!errors.description}>
        <Flex w="full" justify="space-between" align="baseline">
          <Field.Label>
            {strings.form.descriptionLabel}
            <Text as="span" fontWeight="normal" color="fg.muted">
              {strings.form.optional}
            </Text>
          </Field.Label>
          <Counter length={description?.length ?? 0} max={DESC_MAX} />
        </Flex>
        <Textarea
          variant="flushed"
          resize="none"
          rows={3}
          placeholder={strings.form.descriptionPlaceholder}
          {...register('description')}
        />
        <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
      </Field.Root>
    </Stack>
  );

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel?.();
      }}
      noValidate
    >
      {panel ? (
        <Theme appearance="dark" colorPalette="brand" bg="navy" borderRadius="4xl" px="7" py="8">
          {fields}
        </Theme>
      ) : (
        fields
      )}
      <Flex gap="2" {...(panel ? { px: '7', py: '5', justify: 'flex-end' } : { mt: '4' })}>
        {onCancel && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            color="accent.fg"
            borderRadius="full"
            onClick={onCancel}
          >
            {strings.form.cancel}
          </Button>
        )}
        <Button type="submit" size="sm" borderRadius="full" px="5" disabled={!isValid}>
          {submitLabel}
        </Button>
      </Flex>
    </form>
  );
}
