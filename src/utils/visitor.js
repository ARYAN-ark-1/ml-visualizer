import { v4 as uuidv4 } from 'uuid';

const VISITOR_KEY = 'ml_visualizer_visitor_id';

export const getVisitorId = () => {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
        id = uuidv4();
        localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
};
