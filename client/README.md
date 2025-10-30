# Room

Room is a real-time collaborative text editor built using WebSockets, designed to enable multiple users to edit text simultaneously. The application provides a seamless experience for users to collaborate and share ideas in real time.

## Features

- **Real-Time Collaboration**: Multiple users can edit the same document simultaneously, with changes reflected instantly.
- **User-Friendly Interface**: A simple and intuitive interface designed to enhance the writing experience.
- **WebSocket Integration**: Efficient real-time communication between clients and the server.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **WebSocket Library**: ws

## Installation

To get started with Room, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/arkorty/Room.git
   cd Room
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Run the application**:

   ```bash
   bun run dev
   ```

4. **Access the application**: Open your browser and navigate to `http://localhost:3000`.

## Usage

- **Creating a Room**: Users can create a new document from the dashboard.
- **Inviting Collaborators**: Share a link with collaborators to allow them to join the editing session.
- **Editing**: Start typing in the editor; changes will be reflected in real-time for all users.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
