import uuid
import pytest
from fastapi import status

from app import crud, models, security
from .conftest import MANAGER_EMAIL, MANAGER_PASSWORD


def test_me_retorna_codigo_de_associacao_6_digitos(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "association_code" in data
    code = data["association_code"]
    assert code is not None
    assert len(code) == 6
    assert code.isdigit()


def test_associate_com_codigo_valido_associa_e_retorna_token(client, auth_headers):
    # Obtém código do gestor
    me_resp = client.get("/auth/me", headers=auth_headers)
    code = me_resp.json()["association_code"]

    # Agente associa
    assoc_resp = client.post(
        "/associate/",
        json={"code": code, "username": "colaborador1", "hostname": "NOTEBOOK-DELL"},
    )
    assert assoc_resp.status_code == status.HTTP_200_OK
    data = assoc_resp.json()
    assert "token" in data
    token = data["token"]

    # Valida que o token é válido para o agente
    user_id = security.decode_agent_token(token)
    assert user_id is not None


def test_associate_com_codigo_invalido_retorna_400(client):
    response = client.post(
        "/associate/",
        json={"code": "000000", "username": "colaborador1", "hostname": "PC1"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Código inválido" in response.json()["detail"]


def test_crud_tasks_completo(client, auth_headers, db):
    # 1. Cria colaborador vinculado
    me_resp = client.get("/auth/me", headers=auth_headers)
    code = me_resp.json()["association_code"]
    assoc = client.post(
        "/associate/",
        json={"code": code, "username": "dev_test", "hostname": "WORKSTATION"},
    ).json()
    user_id = assoc["user_id"]

    # 2. Gestor cria task
    create_resp = client.post(
        "/tasks/",
        headers=auth_headers,
        json={
            "title": "Implementar MVP",
            "description": "Finalizar módulo de tasks",
            "status": "pending",
            "assigned_user_ids": [user_id],
        },
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    task_data = create_resp.json()
    task_id = task_data["id"]
    assert task_data["title"] == "Implementar MVP"
    assert len(task_data["assigned_users"]) == 1

    # 3. Gestor lista tasks
    list_resp = client.get("/tasks/", headers=auth_headers)
    assert list_resp.status_code == status.HTTP_200_OK
    assert any(t["id"] == task_id for t in list_resp.json())

    # 4. Agente lista my-tasks usando seu token
    agent_token = assoc["token"]
    my_tasks_resp = client.get(
        "/tasks/my-tasks",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert my_tasks_resp.status_code == status.HTTP_200_OK
    my_tasks = my_tasks_resp.json()
    assert any(t["id"] == task_id for t in my_tasks)

    # 5. Agente envia atividade com task_id
    act_resp = client.post(
        "/activities/",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "username": "dev_test",
            "hostname": "WORKSTATION",
            "process_name": "code.exe",
            "window_title": "Visual Studio Code - TimeTracker",
            "duration_seconds": 60,
            "task_id": task_id,
        },
    )
    assert act_resp.status_code == status.HTTP_201_CREATED
    assert act_resp.json()["task_id"] == task_id

    # 6. Atualização de task
    patch_resp = client.patch(
        f"/tasks/{task_id}",
        headers=auth_headers,
        json={"status": "in_progress"},
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.json()["status"] == "in_progress"

    # 7. Exclusão de task
    del_resp = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == status.HTTP_204_NO_CONTENT
