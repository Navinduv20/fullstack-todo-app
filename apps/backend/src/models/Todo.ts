import { Schema, model } from 'mongoose';

// Input rules (lengths, title pattern) live in the shared zod schema, not here.
const todoSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    done: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        const { _id, ...rest } = ret;
        return { id: String(_id), ...rest };
      },
    },
  },
);

todoSchema.index({ createdAt: -1 });

export const Todo = model('Todo', todoSchema);
