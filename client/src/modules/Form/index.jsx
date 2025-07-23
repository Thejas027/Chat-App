import { useState } from "react";
import { Button, Input } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Form = ({ isSignPage = false }) => {
  const [data, setData] = useState({
    ...(isSignPage ? {} : { fullName: "" }),
    email: "",
    password: "",
  });

  const { register, login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (isSignPage) {
        // Login
        result = await login({
          email: data.email,
          password: data.password
        });
      } else {
        // Register
        result = await register({
          fullName: data.fullName,
          email: data.email,
          password: data.password
        });
      }

      if (result.success) {
        // Redirect will be handled automatically by ProtectedRoute
        navigate('/');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className=" h-screen flex justify-center items-center">
      <div className="bg-white w-auto h-auto shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignPage ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            {isSignPage
              ? "Sign in to get explored"
              : "Join us and start connecting with your friends today!"}
          </p>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {!isSignPage && (
            <Input
              label="Full Name"
              name="fullName"
              placeholder="Enter your full name"
              value={data.fullName}
              onChange={handleChange}
              isRequired
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={data.email}
            onChange={handleChange}
            isRequired
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={data.password}
            onChange={handleChange}
            isRequired
          />
          <Button
            label={isLoading ? 'Please wait...' : (isSignPage ? "Sign In" : "Sign Up")}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </form>
        <div className="text-center mt-6 text-gray-600">
          {isSignPage ? (
            <>
              Don't have an account?{" "}
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/users/sign_up")}
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/users/sign_in")}
              >
                Sign In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Form;
