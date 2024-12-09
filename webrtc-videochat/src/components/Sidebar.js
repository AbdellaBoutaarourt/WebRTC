import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function Sidebar({ userName, onLogout, onlineUsers, userId }) {
    return (
        <div className="fixed inset-0 w-64 bg-gray-800 text-white flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-4">Sidebar</h2>
            <div className="flex-1">
                <div className="mb-6">
                    <p className="font-semibold">
                        Welcome, {userName ? userName : 'Guest'}
                    </p>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Online Users</h3>
                    <ul className="space-y-2">
                        {onlineUsers.map((user) => (
                            <li
                                key={user.id}
                                className={`flex items-center justify-between ${user.id === userId ? 'border-r-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    {user.id === userId ? (
                                        <>
                                            <span className="font-semibold">Me  ({user.username})</span>
                                        </>
                                    ) : (
                                        user.username
                                    )}
                                </div>
                                {/* Conditionally render the Copy ID button */}
                                {user.id !== userId && (
                                    <CopyToClipboard text={user.id}>
                                        <button className="text-blue-400 hover:text-blue-500">
                                            Copy ID
                                        </button>
                                    </CopyToClipboard>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-red-500 text-white p-3 rounded-lg w-full hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
