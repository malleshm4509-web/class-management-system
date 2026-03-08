package com.mallesh.jkb.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public List<User> listAll() {
        return repo.findAll();
    }

    public User create(UserCreateRequest req) {
        User u = new User();
        u.setEmail(req.getEmail());
        u.setName(req.getName());
        u.setPassword(encoder.encode(req.getPassword()));
        return repo.save(u);
    }

    public User get(Long id) {
        return repo.findById(id).orElseThrow();
    }
}
