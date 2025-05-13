import { useParams } from "react-router-dom";

const BookPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Book Page</h2>
      <p>Book ID: {id}</p>
      {/* Placeholder for description, feedback, price, etc. */}
      <p>Title: Placeholder</p>
      <p>Description: Placeholder</p>
      <p>Feedback: Placeholder</p>
      <p>Price: $XX.XX</p>
    </div>
  );
};

export default BookPage;
