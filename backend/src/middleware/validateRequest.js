import { validationResult } from "express-validator";

export default function validateRequest(validations) {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array()[0].msg, details: errors.array() });
      }
      next();
    },
  ];
}
