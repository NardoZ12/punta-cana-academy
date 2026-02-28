// Updated middleware.ts

import { NextApiRequest, NextApiResponse } from 'next';

export const sessionMiddleware = async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const session = req.session;

    if (!session || !session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // You can add additional checks here if needed
    next();
};
