import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Radar, LogIn, Lock, User } from 'lucide-react';
import { useAuth } from '../app/providers/AuthContext';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Alert } from '../shared/components/Alert';

export const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Пожалуйста, введите имя пользователя');
      return;
    }
    if (!password) {
      setError('Пожалуйста, введите пароль');
      return;
    }

    try {
      setLoading(true);
      await login({ name: name.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.status === 401 || err.status === 400) {
        setError(err.message || 'Неверное имя пользователя или пароль');
      } else {
        setError(err.message || 'Ошибка при входе в систему. Повторите попытку.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Radar className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            «Учебный радар» — контроль учебных сроков и проектов
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            id="username"
            label="Имя пользователя"
            type="text"
            required
            autoComplete="username"
            placeholder="student_alex"
            leftIcon={<User className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="password"
            label="Пароль"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Войти в аккаунт
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
